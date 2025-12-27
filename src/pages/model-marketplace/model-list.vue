<template>
  <div class="model-list-page p-5">
    <el-card class="header-card">
      <h2 class="text-2xl font-bold mb-2">模型广场</h2>
      <p class="text-gray-500">
        支持各类模型服务的统一纳管，覆盖文本生成、图像生成、语音生成、视频生成、嵌入、重排序模型
      </p>
    </el-card>

    <!-- 筛选区域 -->
    <el-card class="mt-4">
      <el-form :inline="true">
        <el-form-item label="模型名称">
          <el-input v-model="searchQuery" placeholder="输入模型名称搜索" clearable class="w-54" />
        </el-form-item>
        <el-form-item label="模型类别">
          <el-select v-model="filterCategory" placeholder="全部" clearable class="w-32">
            <el-option label="文本生成" value="text" />
            <el-option label="图像生成" value="image" />
            <el-option label="语音生成" value="audio" />
            <el-option label="视频生成" value="video" />
            <el-option label="嵌入模型" value="embedding" />
            <el-option label="重排序" value="rerank" />
          </el-select>
        </el-form-item>
        <el-form-item label="支持能力">
          <el-select v-model="filterCapability" placeholder="全部" clearable class="w-32">
            <el-option label="对话" value="对话" />
            <el-option label="文本生成" value="文本生成" />
            <el-option label="代码生成" value="代码生成" />
            <el-option label="写作" value="写作" />
            <el-option label="推理" value="推理" />
            <el-option label="文生图" value="文生图" />
            <el-option label="语音识别" value="语音识别" />
            <el-option label="语音合成" value="语音合成" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商">
          <el-select v-model="filterVendor" placeholder="全部" clearable class="w-32">
            <el-option label="Meta" value="Meta" />
            <el-option label="OpenAI" value="OpenAI" />
            <el-option label="清华" value="清华" />
            <el-option label="百度" value="百度" />
            <el-option label="阿里" value="阿里" />
            <el-option label="智源" value="智源" />
            <el-option label="Stability AI" value="Stability AI" />
          </el-select>
        </el-form-item>
        <el-form-item label="上下文长度">
          <el-select v-model="filterContext" placeholder="全部" clearable class="w-32">
            <el-option label="512-2K" value="0.5-2" />
            <el-option label="2K-4K" value="2-4" />
            <el-option label="4K-8K" value="4-8" />
            <el-option label="8K+" value="8+" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格参数">
          <el-select v-model="filterParameters" placeholder="全部" clearable class="w-32">
            <el-option label="<1B" value="0-1" />
            <el-option label="1B-10B" value="1-10" />
            <el-option label="10B-100B" value="10-100" />
            <el-option label="100B+" value="100+" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="modelsStore.loadModels"> 搜索 </el-button>
          <el-button @click="resetFilters"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 模型卡片列表 -->
    <div class="model-cards mt-4">
      <el-row :gutter="20">
        <el-col v-for="model in filteredModels" :key="model.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="model-card h-[380px] flex flex-col" shadow="hover">
            <div class="model-header flex justify-between">
              <el-tag :type="getCategoryTag(model.category)" size="small">
                {{ getCategoryName(model.category) }}
              </el-tag>
              <el-tag v-if="model.isDeployed" type="success" size="small"> 已部署 </el-tag>
            </div>

            <div class="model-name mt-3 text-lg font-bold text-[#303133]">
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

            <div class="model-description mt-3 flex-1 overflow-hidden text-sm text-gray-600">
              {{ model.description }}
            </div>

            <div class="model-actions mt-4 flex gap-2">
              <el-button type="primary" size="small" @click="handleViewDetail(model)">
                查看详情
              </el-button>
              <el-button v-if="model.isDeployed" size="small" @click="handleTryOnline(model)">
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
import { ref, computed, onMounted } from 'vue'
import type { ModelCategory } from '~/stores/models'
import type { Model } from '~/stores/models'
import { useModelsStore } from '~/stores/models'
import { useRouter } from 'vue-router'

const router = useRouter()
const modelsStore = useModelsStore()

const searchQuery = ref('')
const filterCategory = ref<ModelCategory | ''>('')
const filterCapability = ref('')
const filterVendor = ref('')
const filterContext = ref('')
const filterParameters = ref('')

const filteredModels = computed<Model[]>(() => {
  let result = modelsStore.models

  if (searchQuery.value) {
    result = result.filter((m) => m.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }

  if (filterCategory.value) {
    result = result.filter((m) => m.category === filterCategory.value)
  }

  if (filterCapability.value) {
    result = result.filter((m) => m.capabilities.includes(filterCapability.value))
  }

  if (filterVendor.value) {
    result = result.filter((m) => m.vendor === filterVendor.value)
  }

  if (filterContext.value) {
    result = result.filter((m) => {
      const ctxStr = m.contextLength.replace('K', '')
      const ctx = Number.parseFloat(ctxStr)
      if (Number.isNaN(ctx)) return false

      if (filterContext.value === '0.5-2') return ctx >= 0.5 && ctx < 2
      if (filterContext.value === '2-4') return ctx >= 2 && ctx < 4
      if (filterContext.value === '4-8') return ctx >= 4 && ctx < 8
      if (filterContext.value === '8+') return ctx >= 8
      return true
    })
  }

  if (filterParameters.value) {
    result = result.filter((m) => {
      const paramStr = m.parameters.replace('B', '').replace('M', '')
      let param = Number.parseFloat(paramStr)
      if (Number.isNaN(param)) return false

      if (m.parameters.includes('M')) param = param / 1000

      if (filterParameters.value === '0-1') return param < 1
      if (filterParameters.value === '1-10') return param >= 1 && param < 10
      if (filterParameters.value === '10-100') return param >= 10 && param < 100
      if (filterParameters.value === '100+') return param >= 100
      return true
    })
  }

  return result
})

const getCategoryTag = (
  category: ModelCategory,
): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<ModelCategory, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    text: 'primary',
    image: 'success',
    audio: 'warning',
    video: 'danger',
    embedding: 'info',
    rerank: 'info',
  }
  return map[category] || 'info'
}

const getCategoryName = (category: ModelCategory): string => {
  const map: Record<ModelCategory, string> = {
    text: '文本生成',
    image: '图像生成',
    audio: '语音生成',
    video: '视频生成',
    embedding: '嵌入模型',
    rerank: '重排序',
  }
  return map[category] || category
}

const handleViewDetail = (model: Model) => {
  modelsStore.setCurrentModel(model)
  router.push('/model-marketplace/model-detail')
}

const handleTryOnline = (model: Model) => {
  modelsStore.setCurrentModel(model)
  router.push('/model-marketplace/playground')
}

const resetFilters = () => {
  searchQuery.value = ''
  filterCategory.value = ''
  filterCapability.value = ''
  filterVendor.value = ''
  filterContext.value = ''
  filterParameters.value = ''
}

onMounted(() => {
  modelsStore.loadModels()
})
</script>

<style scoped lang="scss">
.model-list-page {
  .model-card {
    margin-bottom: 1.25rem;

    .model-description {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
}
</style>
