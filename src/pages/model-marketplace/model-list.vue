<template>
  <div class="model-list-page">
    <el-card class="header-card">
      <h2 class="text-2xl font-bold mb-2">
        模型广场
      </h2>
      <p class="text-gray-500">
        支持各类模型服务的统一纳管，覆盖文本生成、图像生成、语音生成、视频生成、嵌入、重排序模型
      </p>
    </el-card>

    <!-- 筛选区域 -->
    <el-card class="mt-4">
      <el-form :inline="true">
        <el-form-item label="模型名称">
          <el-input
            v-model="searchQuery"
            placeholder="输入模型名称搜索"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item label="模型类别">
          <el-select v-model="filterCategory" placeholder="全部" clearable style="width: 150px">
            <el-option label="文本生成" value="text" />
            <el-option label="图像生成" value="image" />
            <el-option label="语音生成" value="audio" />
            <el-option label="视频生成" value="video" />
            <el-option label="嵌入模型" value="embedding" />
            <el-option label="重排序" value="rerank" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商">
          <el-select v-model="filterVendor" placeholder="全部" clearable style="width: 150px">
            <el-option label="Meta" value="Meta" />
            <el-option label="OpenAI" value="OpenAI" />
            <el-option label="清华" value="清华" />
            <el-option label="百度" value="百度" />
            <el-option label="阿里" value="阿里" />
          </el-select>
        </el-form-item>
        <el-form-item label="上下文长度">
          <el-select v-model="filterContext" placeholder="全部" clearable style="width: 150px">
            <el-option label="2K-4K" value="2-4" />
            <el-option label="4K-8K" value="4-8" />
            <el-option label="8K+" value="8+" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadModels">
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 模型卡片列表 -->
    <div class="model-cards mt-4">
      <el-row :gutter="20">
        <el-col
          v-for="model in filteredModels"
          :key="model.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="model-card" shadow="hover">
            <div class="model-header">
              <el-tag :type="getCategoryTag(model.category)" size="small">
                {{ getCategoryName(model.category) }}
              </el-tag>
              <el-tag v-if="model.isDeployed" type="success" size="small">
                已部署
              </el-tag>
            </div>

            <div class="model-name mt-3">
              {{ model.name }}
            </div>

            <div class="model-vendor mt-1 text-sm text-gray-500">
              {{ model.vendor }} · {{ model.version }}
            </div>

            <div class="model-params mt-2">
              <el-descriptions :column="1" size="small" border>
                <el-descriptions-item label="参数量">
                  {{ model.parameters }}
                </el-descriptions-item>
                <el-descriptions-item label="上下文">
                  {{ model.contextLength }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="model-description mt-3 text-sm text-gray-600">
              {{ model.description }}
            </div>

            <div class="model-actions mt-4">
              <el-button type="primary" size="small" @click="viewDetail(model)">
                查看详情
              </el-button>
              <el-button v-if="model.isDeployed" size="small" @click="tryOnline(model)">
                在线体验
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
const models = ref<Model[]>([])
const searchQuery = ref('')
const filterCategory = ref('')
const filterVendor = ref('')
const filterContext = ref('')

function initMockData(): Model[] {
  return [
    {
      id: '1',
      name: 'Llama-2-7B',
      category: 'text',
      vendor: 'Meta',
      version: 'v2.0',
      parameters: '7B',
      contextLength: '4K',
      description: 'Meta开源的大语言模型，适用于对话、文本生成等任务',
      isDeployed: true,
      capabilities: ['对话', '文本生成', '代码生成'],
      useCases: ['智能客服', '内容创作', '代码辅助'],
    },
    {
      id: '2',
      name: 'ChatGLM-6B',
      category: 'text',
      vendor: '清华',
      version: 'v1.0',
      parameters: '6B',
      contextLength: '2K',
      description: '清华开源的中英双语对话模型',
      isDeployed: true,
      capabilities: ['中英对话', '文本生成'],
      useCases: ['智能问答', '文本摘要'],
    },
    {
      id: '3',
      name: 'ERNIE-Bot',
      category: 'text',
      vendor: '百度',
      version: '3.5',
      parameters: '260B',
      contextLength: '8K',
      description: '百度文心大模型，具有强大的中文理解能力',
      isDeployed: false,
      capabilities: ['对话', '写作', '推理'],
      useCases: ['智能写作', '知识问答'],
    },
    {
      id: '4',
      name: 'Stable Diffusion XL',
      category: 'image',
      vendor: 'Stability AI',
      version: '1.0',
      parameters: '6.6B',
      contextLength: '-',
      description: '高质量图像生成模型',
      isDeployed: true,
      capabilities: ['文生图', '图生图'],
      useCases: ['艺术创作', '设计辅助'],
    },
    {
      id: '5',
      name: 'Qwen-Audio',
      category: 'audio',
      vendor: '阿里',
      version: '1.0',
      parameters: '7B',
      contextLength: '8K',
      description: '通义千问音频大模型',
      isDeployed: true,
      capabilities: ['语音识别', '语音合成'],
      useCases: ['语音助手', '音频转写'],
    },
    {
      id: '6',
      name: 'BGE-Large',
      category: 'embedding',
      vendor: '智源',
      version: '1.5',
      parameters: '326M',
      contextLength: '512',
      description: '中英文嵌入模型',
      isDeployed: true,
      capabilities: ['文本嵌入', '语义检索'],
      useCases: ['语义搜索', '文档检索'],
    },
  ]
}

const filteredModels = computed(() => {
  let result = models.value

  if (searchQuery.value) {
    result = result.filter(m =>
      m.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  if (filterCategory.value) {
    result = result.filter(m => m.category === filterCategory.value)
  }

  if (filterVendor.value) {
    result = result.filter(m => m.vendor === filterVendor.value)
  }

  if (filterContext.value) {
    result = result.filter((m) => {
      const ctx = Number.parseInt(m.contextLength)
      if (filterContext.value === '2-4')
        return ctx >= 2 && ctx < 4
      if (filterContext.value === '4-8')
        return ctx >= 4 && ctx < 8
      if (filterContext.value === '8+')
        return ctx >= 8
      return true
    })
  }

  return result
})

function getCategoryTag(category: string) {
  const map: Record<string, string> = {
    text: 'primary',
    image: 'success',
    audio: 'warning',
    video: 'danger',
    embedding: 'info',
    rerank: '',
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

function viewDetail(model: Model) {
  setStorage('current-model', model)
  router.push('/model-marketplace/model-detail')
}

function tryOnline(model: Model) {
  setStorage('current-model', model)
  router.push('/model-marketplace/playground')
}

function loadModels() {
  const stored = getStorage<Model[]>('models', [])
  if (stored.length === 0) {
    models.value = initMockData()
    setStorage('models', models.value)
  }
  else {
    models.value = stored
  }
}

onMounted(() => {
  loadModels()
})
</script>

<style scoped lang="scss">
.model-list-page {
  padding: 20px;

  .model-cards {
    .model-card {
      margin-bottom: 20px;
      height: 380px;
      display: flex;
      flex-direction: column;

      .model-header {
        display: flex;
        justify-content: space-between;
      }

      .model-name {
        font-size: 18px;
        font-weight: bold;
        color: #303133;
      }

      .model-description {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .model-actions {
        display: flex;
        gap: 10px;
      }
    }
  }
}
</style>
