<template>
  <div class="model-detail-page">
    <el-page-header @back="goBack">
      <template #content>
        <div class="flex items-center gap-3">
          <span class="text-2xl font-bold">{{ model?.name }}</span>
          <el-tag :type="getCategoryTag(model?.category || '')">
            {{ getCategoryName(model?.category || '') }}
          </el-tag>
        </div>
      </template>
    </el-page-header>

    <el-card v-if="model" class="mt-4">
      <el-tabs v-model="activeTab">
        <!-- 模型介绍 -->
        <el-tab-pane label="模型介绍" name="intro">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="模型名称">{{ model.name }}</el-descriptions-item>
            <el-descriptions-item label="厂商/系列">{{ model.vendor }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ model.version }}</el-descriptions-item>
            <el-descriptions-item label="参数量">{{ model.parameters }}</el-descriptions-item>
            <el-descriptions-item label="上下文长度">{{ model.contextLength }}</el-descriptions-item>
            <el-descriptions-item label="模型类型">{{ getCategoryName(model.category) }}</el-descriptions-item>
          </el-descriptions>

          <div class="mt-4">
            <h3 class="font-bold mb-2">模型描述</h3>
            <p class="text-gray-600">{{ model.description }}</p>
          </div>

          <div class="mt-4">
            <h3 class="font-bold mb-2">支持能力</h3>
            <el-space wrap>
              <el-tag v-for="cap in model.capabilities" :key="cap" type="info">
                {{ cap }}
              </el-tag>
            </el-space>
          </div>

          <div class="mt-4">
            <h3 class="font-bold mb-2">使用场景</h3>
            <el-space wrap>
              <el-tag v-for="use in model.useCases" :key="use" type="success">
                {{ use }}
              </el-tag>
            </el-space>
          </div>

          <div class="mt-4">
            <h3 class="font-bold mb-2">技术亮点</h3>
            <ul class="list-disc pl-6 text-gray-600">
              <li>采用先进的Transformer架构，性能优异</li>
              <li>支持多语言处理，中英文效果出色</li>
              <li>经过大规模数据训练，泛化能力强</li>
              <li>支持Fine-tuning，可针对特定任务优化</li>
            </ul>
          </div>
        </el-tab-pane>

        <!-- 测评效果 -->
        <el-tab-pane label="测评效果" name="evaluation">
          <el-table :data="evaluationData" border>
            <el-table-column prop="dataset" label="测评数据集" />
            <el-table-column prop="metric" label="评估指标" />
            <el-table-column prop="score" label="得分" align="center">
              <template #default="{ row }">
                <el-tag type="success">{{ row.score }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- API文档 -->
        <el-tab-pane label="API文档" name="api">
          <div class="api-doc">
            <h3 class="font-bold mb-3">调用示例</h3>
            <el-alert type="info" :closable="false" class="mb-3">
              <p>API端点: <code>https://api.example.com/v1/chat/completions</code></p>
            </el-alert>

            <h4 class="font-bold mt-4 mb-2">Python示例</h4>
            <pre class="code-block"><code>import requests

url = "https://api.example.com/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "{{ model.name }}",
    "messages": [
        {"role": "user", "content": "你好"}
    ],
    "temperature": 0.7,
    "max_tokens": 2000
}

response = requests.post(url, headers=headers, json=data)
print(response.json())</code></pre>

            <h4 class="font-bold mt-4 mb-2">cURL示例</h4>
            <pre class="code-block"><code>curl https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{ model.name }}",
    "messages": [{"role": "user", "content": "你好"}],
    "temperature": 0.7
  }'</code></pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 操作按钮 -->
    <div class="mt-4 flex gap-3">
      <el-button v-if="model?.isDeployed" type="primary" size="large" @click="tryOnline">
        在线体验
      </el-button>
      <el-button size="large" @click="viewAPIDoc">
        查看API文档
      </el-button>
      <el-button size="large" @click="deployModel">
        部署模型
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getStorage, setStorage } from '~/utils/storage'

interface Model {
  id: string
  name: string
  category: string
  vendor: string
  version: string
  parameters: string
  contextLength: string
  description: string
  isDeployed: boolean
  capabilities: string[]
  useCases: string[]
}

const router = useRouter()
const model = ref<Model | null>(null)
const activeTab = ref('intro')

const evaluationData = ref([
  { dataset: 'MMLU', metric: 'Accuracy', score: '85.2%' },
  { dataset: 'C-Eval', metric: 'Accuracy', score: '78.5%' },
  { dataset: 'GSM8K', metric: 'Accuracy', score: '72.3%' },
  { dataset: 'HumanEval', metric: 'Pass@1', score: '65.8%' },
])

function getCategoryTag(category: string) {
  const map: Record<string, string> = {
    text: 'primary',
    image: 'success',
    audio: 'warning',
    video: 'danger',
    embedding: 'info',
  }
  return map[category] || ''
}

function getCategoryName(category: string) {
  const map: Record<string, string> = {
    text: '文本生成',
    image: '图像生成',
    audio: '语音生成',
    video: '视频生成',
    embedding: '嵌入模型',
    rerank: '重排序',
  }
  return map[category] || category
}

function goBack() {
  router.back()
}

function tryOnline() {
  router.push('/model-marketplace/playground')
}

function viewAPIDoc() {
  activeTab.value = 'api'
}

function deployModel() {
  setStorage('deploy-model', model.value)
  router.push('/model-deployment/one-click-deploy')
}

onMounted(() => {
  model.value = getStorage<Model | null>('current-model', null)
})
</script>

<style scoped lang="scss">
.model-detail-page {
  padding: 20px;

  .api-doc {
    .code-block {
      background: #f5f7fa;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;

      code {
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.6;
      }
    }
  }
}
</style>
