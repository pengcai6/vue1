<template>
  <div class="playground-page">
    <el-card class="header-card">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold mb-2">
            在线体验 (Playground)
          </h2>
          <p class="text-gray-500">
            模型: {{ model?.name || '未选择' }}
          </p>
        </div>
        <el-button @click="goBack">
          返回
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="20" class="mt-4">
      <!-- 左侧：对话区域 -->
      <el-col :span="16">
        <el-card class="chat-card">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">对话窗口</span>
              <el-button size="small" @click="clearMessages">
                清空对话
              </el-button>
            </div>
          </template>

          <div class="chat-messages" ref="messagesRef">
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="message-item"
              :class="msg.role"
            >
              <div class="message-role">
                {{ msg.role === 'user' ? '用户' : 'AI助手' }}
              </div>
              <div class="message-content">
                {{ msg.content }}
              </div>
              <div class="message-time">{{ msg.timestamp }}</div>
            </div>

            <div v-if="isGenerating" class="message-item assistant">
              <div class="message-role">AI助手</div>
              <div class="message-content">
                <el-icon class="is-loading">
                  <i-ep-loading />
                </el-icon>
                正在生成回复...
              </div>
            </div>
          </div>

          <div class="chat-input mt-4">
            <el-input
              v-model="userInput"
              type="textarea"
              :rows="3"
              placeholder="输入你的问题..."
              @keydown.ctrl.enter="sendMessage"
            />
            <div class="mt-2 flex justify-end">
              <el-button
                type="primary"
                :loading="isGenerating"
                :disabled="!userInput.trim()"
                @click="sendMessage"
              >
                发送 (Ctrl+Enter)
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：参数配置 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span class="font-bold">推理参数</span>
          </template>

          <el-form label-width="120px" size="small">
            <el-form-item label="系统提示词">
              <el-input
                v-model="params.systemPrompt"
                type="textarea"
                :rows="3"
                placeholder="你是一个有帮助的AI助手"
              />
            </el-form-item>

            <el-form-item label="温度 (Temperature)">
              <el-slider v-model="params.temperature" :min="0" :max="2" :step="0.1" show-input />
              <div class="text-xs text-gray-500 mt-1">
                控制输出的随机性，值越大越随机
              </div>
            </el-form-item>

            <el-form-item label="Top P">
              <el-slider v-model="params.topP" :min="0" :max="1" :step="0.05" show-input />
              <div class="text-xs text-gray-500 mt-1">
                控制输出的多样性
              </div>
            </el-form-item>

            <el-form-item label="最大Token数">
              <el-input-number v-model="params.maxTokens" :min="100" :max="4000" :step="100" />
            </el-form-item>

            <el-form-item label="重复惩罚">
              <el-slider v-model="params.repetitionPenalty" :min="1" :max="2" :step="0.1" show-input />
              <div class="text-xs text-gray-500 mt-1">
                降低重复内容的概率
              </div>
            </el-form-item>

            <el-form-item label="Top K">
              <el-input-number v-model="params.topK" :min="1" :max="100" />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 性能统计 -->
        <el-card class="mt-4">
          <template #header>
            <span class="font-bold">性能统计</span>
          </template>

          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="TTFT">{{ stats.ttft }} ms</el-descriptions-item>
            <el-descriptions-item label="TPS">{{ stats.tps }} tokens/s</el-descriptions-item>
            <el-descriptions-item label="总耗时">{{ stats.totalTime }} ms</el-descriptions-item>
            <el-descriptions-item label="生成Token数">{{ stats.generatedTokens }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStorage } from '~/utils/storage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const router = useRouter()
const model = ref<any>(null)
const messages = ref<Message[]>([])
const userInput = ref('')
const isGenerating = ref(false)
const messagesRef = ref<HTMLElement>()

const params = ref({
  systemPrompt: '你是一个有帮助的AI助手',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2000,
  repetitionPenalty: 1.1,
  topK: 50,
})

const stats = ref({
  ttft: 0,
  tps: 0,
  totalTime: 0,
  generatedTokens: 0,
})

const mockResponses = [
  '你好！我是AI助手，很高兴为你服务。有什么我可以帮助你的吗？',
  '这是一个很好的问题。让我来为你详细解答...',
  '根据你的需求，我建议可以从以下几个方面考虑：1) 首先..., 2) 其次..., 3) 最后...',
  '我理解你的意思。这个问题可以这样解决...',
  '很高兴能帮到你！还有其他问题吗？',
]

function goBack() {
  router.back()
}

function clearMessages() {
  messages.value = []
  ElMessage.success('对话已清空')
}

async function sendMessage() {
  if (!userInput.value.trim() || isGenerating.value)
    return

  // 添加用户消息
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: userInput.value,
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(userMessage)
  userInput.value = ''

  // 模拟AI生成
  isGenerating.value = true
  const startTime = Date.now()

  await nextTick()
  scrollToBottom()

  // 模拟TTFT
  const ttft = Math.floor(Math.random() * 300 + 100)
  await new Promise(resolve => setTimeout(resolve, ttft))

  // 生成响应
  const response = mockResponses[Math.floor(Math.random() * mockResponses.length)]
  const assistantMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: response,
    timestamp: new Date().toLocaleTimeString(),
  }

  await new Promise(resolve => setTimeout(resolve, 1000))
  messages.value.push(assistantMessage)
  isGenerating.value = false

  // 更新统计
  const totalTime = Date.now() - startTime
  stats.value = {
    ttft,
    tps: Math.floor(Math.random() * 50 + 30),
    totalTime,
    generatedTokens: Math.floor(response.length / 2),
  }

  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

onMounted(() => {
  model.value = getStorage('current-model', null)
})
</script>

<style scoped lang="scss">
.playground-page {
  padding: 20px;

  .chat-card {
    height: calc(100vh - 250px);
    display: flex;
    flex-direction: column;

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 15px;
      background: #f5f7fa;
      border-radius: 4px;

      .message-item {
        margin-bottom: 20px;
        padding: 12px;
        border-radius: 8px;

        &.user {
          background: #e3f2fd;
          margin-left: 60px;

          .message-role {
            color: #1976d2;
          }
        }

        &.assistant {
          background: #fff;
          margin-right: 60px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

          .message-role {
            color: #43a047;
          }
        }

        .message-role {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 6px;
        }

        .message-content {
          color: #303133;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .message-time {
          font-size: 11px;
          color: #909399;
          margin-top: 6px;
        }
      }
    }
  }
}
</style>
