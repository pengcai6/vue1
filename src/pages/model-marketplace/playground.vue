<template>
  <div class="playground-page p-5">
    <el-card class="header-card">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold mb-2">在线体验 (Playground)</h2>
          <p class="text-gray-500">模型: {{ modelsStore.currentModel?.name || '未选择' }}</p>
        </div>
        <el-button @click="goBack">返回</el-button>
      </div>
    </el-card>

    <el-row :gutter="20" class="mt-4">
      <!-- 左侧：对话区域 -->
      <el-col :span="16">
        <el-card class="chat-card">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">对话窗口</span>
              <el-button size="small" @click="clearMessages">清空对话</el-button>
            </div>
          </template>

          <div class="chat-body flex flex-col h-[calc(100vh-340px)]">
            <!-- 消息列表 -->
            <div ref="messagesRef" class="flex-1 mb-4 overflow-auto bg-[#f5f7fa] rounded p-4">
              <div v-if="messages.length === 0" class="text-center text-gray-400">
                <p>开始与 AI 助手对话吧...</p>
              </div>
              <!-- 使用 ant-design-x-vue 的 Bubble.List 组件 -->
              <Bubble.List v-if="messages.length > 0" :items="messages" :roles="roles">
                <template #content="{ content }">
                  <template v-if="typeof content === 'string'">
                    <div class="message-text">{{ content }}</div>
                  </template>
                </template>
              </Bubble.List>

              <!-- 加载中状态 -->
              <div v-if="isGenerating" class="mt-4 bg-white shadow p-3 rounded">
                <div class="text-xs text-gray-500">AI助手</div>
                <div class="text-[#303133]">
                  <el-icon class="is-loading inline-flex align-middle">
                    <Loading />
                  </el-icon>
                  正在思考...
                </div>
              </div>
            </div>

            <!-- 使用 ant-design-x-vue 的 Sender 组件 -->
            <div class="chat-input-area">
              <Sender
                v-model="userInput"
                placeholder="输入你的问题..."
                submit-text="发送"
                :loading="isGenerating"
                @submit="handleSend"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：参数配置 -->
      <el-col :span="8" class="right-sidebar">
        <div class="right-sidebar-content">
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

              <el-form-item label="温度">
                <el-slider v-model="params.temperature" :min="0" :max="2" :step="0.1" show-input />
                <div class="text-xs text-gray-500 mt-1">控制输出的随机性，值越大越随机</div>
              </el-form-item>

              <el-form-item label="Top P">
                <el-slider v-model="params.topP" :min="0" :max="1" :step="0.05" show-input />
                <div class="text-xs text-gray-500 mt-1">控制输出的多样性</div>
              </el-form-item>

              <el-form-item label="最大Token数">
                <el-input-number v-model="params.maxTokens" :min="100" :max="4000" :step="100" />
              </el-form-item>

              <el-form-item label="重复惩罚">
                <el-slider
                  v-model="params.repetitionPenalty"
                  :min="1"
                  :max="2"
                  :step="0.1"
                  show-input
                />
                <div class="text-xs text-gray-500 mt-1">降低重复内容的概率</div>
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
              <el-descriptions-item label="生成Token数">{{
                stats.generatedTokens
              }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { Loading, UserFilled } from '@element-plus/icons-vue'
import { useModelsStore } from '~/stores/models'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bubble, Sender } from 'ant-design-x-vue'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

const router = useRouter()
const modelsStore = useModelsStore()

const messages = ref<Message[]>([])
const userInput = ref('')
const isGenerating = ref(false)
const messagesRef = ref<HTMLElement>()

const roles = {
  user: {
    placement: 'end',
    variant: 'shadow',
    avatar: { icon: UserFilled, style: { backgroundColor: '#fde3cf' } },
  },
  assistant: {
    placement: 'start',
    variant: 'outlined',
    avatar: { style: { backgroundColor: '#87d068' }, content: 'AI' },
  },
}

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

const goBack = () => {
  router.back()
}

const clearMessages = () => {
  messages.value = []
  ElMessage.success('对话已清空')
}

const handleSend = async (content: string) => {
  if (!content.trim() || isGenerating.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: new Date().toLocaleTimeString(),
  }
  messages.value.push(userMessage)
  userInput.value = ''
  isGenerating.value = true

  // 模拟 API 请求延迟
  const ttft = Math.floor(Math.random() * 300 + 100)
  await new Promise((resolve) => setTimeout(resolve, ttft))

  const response = mockResponses[Math.floor(Math.random() * mockResponses.length)]
  const assistantMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: response,
    timestamp: new Date().toLocaleTimeString(),
  }

  await new Promise((resolve) => setTimeout(resolve, 800))
  messages.value.push(assistantMessage)
  isGenerating.value = false

  // 更新性能统计
  stats.value = {
    ttft,
    tps: Math.floor(Math.random() * 50 + 30),
    totalTime: ttft + 800,
    generatedTokens: Math.floor(response.length / 2),
  }

  await scrollToBottom()
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

onMounted(() => {
  modelsStore.loadCurrentModel()
})
</script>

<style scoped lang="scss">
.playground-page {
  .chat-body {
    .message-text {
      line-height: 1.6;
      white-space: pre-wrap;
    }
  }
}
</style>
