import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ModelCategory = 'text' | 'image' | 'audio' | 'video' | 'embedding' | 'rerank'

export interface Model {
  id: string
  name: string
  category: ModelCategory
  vendor: string
  version: string
  parameters: string
  contextLength: string
  description: string
  isDeployed: boolean
  capabilities: string[]
  useCases: string[]
}

const initMockData = (): Model[] => [
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
    isDeployed: true,
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

export const useModelsStore = defineStore('models', () => {
  const models = ref<Model[]>([])
  const currentModel = ref<Model | null>(null)

  const loadModels = () => {
    const stored = localStorage.getItem('models')
    if (stored) {
      try {
        models.value = JSON.parse(stored)
      } catch {
        models.value = initMockData()
      }
    }
    else {
      models.value = initMockData()
    }
  }

  const getModelById = (id: string): Model | undefined => models.value.find(m => m.id === id)

  const updateModelIsDeployed = (id: string, isDeployed: boolean) => {
    const model = getModelById(id)
    if (model) {
      model.isDeployed = isDeployed
    }
  }

  const setCurrentModel = (model: Model | null) => {
    currentModel.value = model
    if (model) {
      localStorage.setItem('current-model', JSON.stringify(model))
    }
    else {
      localStorage.removeItem('current-model')
    }
  }

  watch(
    models,
    (newModels) => {
      localStorage.setItem('models', JSON.stringify(newModels))
    },
    { deep: true },
  )

  const loadCurrentModel = () => {
    const stored = localStorage.getItem('current-model')
    if (stored) {
      try {
        currentModel.value = JSON.parse(stored)
      } catch {
        currentModel.value = null
      }
    }
  }

  return {
    models,
    currentModel,
    loadModels,
    getModelById,
    updateModelIsDeployed,
    setCurrentModel,
    loadCurrentModel,
  }
})
