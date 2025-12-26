<template>
  <div class="resource-pool-page">
    <el-card class="header-card">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold mb-2">
            资源池管理（异构加速器）
          </h2>
          <p class="text-gray-500">
            统一管理和调度异构GPU加速卡资源
          </p>
        </div>
        <el-button type="primary" @click="showAddDialog = true">
          添加GPU节点
        </el-button>
      </div>
    </el-card>

    <!-- 资源总览 -->
    <el-row :gutter="20" class="mt-4">
      <el-col :span="6">
        <el-card>
          <el-statistic title="总节点数" :value="gpuNodes.length" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="总GPU卡数" :value="totalGPUs" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic 
            title="可用GPU卡数" 
            :value="availableGPUs"
            :value-style="{ color: '#67C23A' }"
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic 
            title="平均利用率" 
            :value="avgUtilization"
            suffix="%"
            :precision="1"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- GPU节点列表 -->
    <el-card class="mt-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">GPU节点列表</span>
          <el-input
            v-model="searchText"
            placeholder="搜索节点名称或GPU型号"
            style="width: 300px"
            clearable
          >
            <template #prefix>
              <el-icon><i-ep-search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <el-table :data="filteredNodes" stripe>
        <el-table-column prop="nodeName" label="节点名称" width="200" />
        <el-table-column prop="gpuType" label="GPU类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getGPUTypeTag(row.gpuType)">
              {{ row.gpuType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gpuCount" label="GPU数量" width="100" align="center" />
        <el-table-column prop="memoryPerGPU" label="单卡显存" width="120" align="center">
          <template #default="{ row }">
            {{ row.memoryPerGPU }} GB
          </template>
        </el-table-column>
        <el-table-column prop="totalMemory" label="总显存" width="120" align="center">
          <template #default="{ row }">
            {{ row.gpuCount * row.memoryPerGPU }} GB
          </template>
        </el-table-column>
        <el-table-column label="利用率" width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-progress 
                :percentage="row.utilization" 
                :color="getUtilizationColor(row.utilization)"
                :show-text="false"
              />
              <span>{{ row.utilization }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="availableGPUs" label="可用卡数" width="100" align="center">
          <template #default="{ row }">
            <span class="text-green-600 font-bold">{{ row.availableGPUs }}</span> / {{ row.gpuCount }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">
              详情
            </el-button>
            <el-button link type="warning" @click="editNode(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除此节点吗？"
              @confirm="deleteNode(row.id)"
            >
              <template #reference>
                <el-button link type="danger">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑GPU节点对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEditing ? '编辑GPU节点' : '添加GPU节点'"
      width="600px"
    >
      <el-form :model="nodeForm" label-width="120px">
        <el-form-item label="节点名称">
          <el-input v-model="nodeForm.nodeName" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="GPU类型">
          <el-select v-model="nodeForm.gpuType" placeholder="请选择GPU类型" style="width: 100%">
            <el-option label="NVIDIA A100" value="NVIDIA A100" />
            <el-option label="NVIDIA H100" value="NVIDIA H100" />
            <el-option label="昇腾 910B" value="昇腾 910B" />
            <el-option label="沐曦 C500" value="沐曦 C500" />
            <el-option label="海光 DCU" value="海光 DCU" />
            <el-option label="摩尔线程 MTT S80" value="摩尔线程 MTT S80" />
            <el-option label="阿里 PPU" value="阿里 PPU" />
          </el-select>
        </el-form-item>
        <el-form-item label="GPU数量">
          <el-input-number v-model="nodeForm.gpuCount" :min="1" :max="8" />
        </el-form-item>
        <el-form-item label="单卡显存(GB)">
          <el-input-number v-model="nodeForm.memoryPerGPU" :min="16" :max="128" :step="8" />
        </el-form-item>
        <el-form-item label="利用率(%)">
          <el-slider v-model="nodeForm.utilization" :max="100" />
        </el-form-item>
        <el-form-item label="可用卡数">
          <el-input-number v-model="nodeForm.availableGPUs" :min="0" :max="nodeForm.gpuCount" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="nodeForm.status">
            <el-radio value="online">在线</el-radio>
            <el-radio value="offline">离线</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveNode">保存</el-button>
      </template>
    </el-dialog>

    <!-- 节点详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="GPU节点详情"
      width="800px"
    >
      <el-descriptions v-if="currentNode" :column="2" border>
        <el-descriptions-item label="节点名称">{{ currentNode.nodeName }}</el-descriptions-item>
        <el-descriptions-item label="GPU类型">{{ currentNode.gpuType }}</el-descriptions-item>
        <el-descriptions-item label="GPU数量">{{ currentNode.gpuCount }}</el-descriptions-item>
        <el-descriptions-item label="单卡显存">{{ currentNode.memoryPerGPU }} GB</el-descriptions-item>
        <el-descriptions-item label="总显存">{{ currentNode.gpuCount * currentNode.memoryPerGPU }} GB</el-descriptions-item>
        <el-descriptions-item label="利用率">{{ currentNode.utilization }}%</el-descriptions-item>
        <el-descriptions-item label="可用卡数">{{ currentNode.availableGPUs }} / {{ currentNode.gpuCount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentNode.status === 'online' ? 'success' : 'danger'">
            {{ currentNode.status === 'online' ? '在线' : '离线' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getStorage, setStorage } from '~/utils/storage'

interface GPUNode {
  id: string
  nodeName: string
  gpuType: string
  gpuCount: number
  memoryPerGPU: number
  utilization: number
  status: 'online' | 'offline'
  availableGPUs: number
}

// 初始化Mock数据
const initMockData = (): GPUNode[] => [
  {
    id: '1',
    nodeName: 'gpu-node-01',
    gpuType: 'NVIDIA A100',
    gpuCount: 8,
    memoryPerGPU: 80,
    utilization: 75,
    status: 'online',
    availableGPUs: 2,
  },
  {
    id: '2',
    nodeName: 'gpu-node-02',
    gpuType: 'NVIDIA H100',
    gpuCount: 8,
    memoryPerGPU: 80,
    utilization: 60,
    status: 'online',
    availableGPUs: 3,
  },
  {
    id: '3',
    nodeName: 'gpu-node-03',
    gpuType: '昇腾 910B',
    gpuCount: 8,
    memoryPerGPU: 64,
    utilization: 45,
    status: 'online',
    availableGPUs: 5,
  },
  {
    id: '4',
    nodeName: 'gpu-node-04',
    gpuType: '沐曦 C500',
    gpuCount: 4,
    memoryPerGPU: 64,
    utilization: 30,
    status: 'online',
    availableGPUs: 3,
  },
  {
    id: '5',
    nodeName: 'gpu-node-05',
    gpuType: '海光 DCU',
    gpuCount: 4,
    memoryPerGPU: 32,
    utilization: 20,
    status: 'online',
    availableGPUs: 4,
  },
]

const gpuNodes = ref<GPUNode[]>([])
const searchText = ref('')
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const isEditing = ref(false)
const currentNode = ref<GPUNode | null>(null)
const nodeForm = ref<Partial<GPUNode>>({
  nodeName: '',
  gpuType: '',
  gpuCount: 4,
  memoryPerGPU: 80,
  utilization: 0,
  status: 'online',
  availableGPUs: 4,
})

// 计算属性
const filteredNodes = computed(() => {
  if (!searchText.value)
    return gpuNodes.value
  return gpuNodes.value.filter(node =>
    node.nodeName.toLowerCase().includes(searchText.value.toLowerCase())
    || node.gpuType.toLowerCase().includes(searchText.value.toLowerCase()),
  )
})

const totalGPUs = computed(() => {
  return gpuNodes.value.reduce((sum, node) => sum + node.gpuCount, 0)
})

const availableGPUs = computed(() => {
  return gpuNodes.value.reduce((sum, node) => sum + node.availableGPUs, 0)
})

const avgUtilization = computed(() => {
  if (gpuNodes.value.length === 0)
    return 0
  const total = gpuNodes.value.reduce((sum, node) => sum + node.utilization, 0)
  return total / gpuNodes.value.length
})

// 方法
function getGPUTypeTag(type: string) {
  if (type.includes('NVIDIA'))
    return 'success'
  if (type.includes('昇腾'))
    return 'warning'
  if (type.includes('沐曦'))
    return 'danger'
  if (type.includes('海光'))
    return 'info'
  return ''
}

function getUtilizationColor(utilization: number) {
  if (utilization < 30)
    return '#67C23A'
  if (utilization < 70)
    return '#E6A23C'
  return '#F56C6C'
}

function viewDetail(node: GPUNode) {
  currentNode.value = node
  showDetailDialog.value = true
}

function editNode(node: GPUNode) {
  isEditing.value = true
  nodeForm.value = { ...node }
  showAddDialog.value = true
}

function deleteNode(id: string) {
  gpuNodes.value = gpuNodes.value.filter(node => node.id !== id)
  saveToStorage()
}

function saveNode() {
  if (isEditing.value && nodeForm.value.id) {
    const index = gpuNodes.value.findIndex(n => n.id === nodeForm.value.id)
    if (index !== -1) {
      gpuNodes.value[index] = { ...nodeForm.value as GPUNode }
    }
  }
  else {
    const newNode: GPUNode = {
      ...nodeForm.value as GPUNode,
      id: Date.now().toString(),
    }
    gpuNodes.value.push(newNode)
  }
  saveToStorage()
  showAddDialog.value = false
  resetForm()
}

function resetForm() {
  isEditing.value = false
  nodeForm.value = {
    nodeName: '',
    gpuType: '',
    gpuCount: 4,
    memoryPerGPU: 80,
    utilization: 0,
    status: 'online',
    availableGPUs: 4,
  }
}

function saveToStorage() {
  setStorage('gpu-nodes', gpuNodes.value)
}

function loadFromStorage() {
  const stored = getStorage<GPUNode[]>('gpu-nodes', [])
  if (stored.length === 0) {
    gpuNodes.value = initMockData()
    saveToStorage()
  }
  else {
    gpuNodes.value = stored
  }
}

onMounted(() => {
  loadFromStorage()
})
</script>

<style scoped lang="scss">
.resource-pool-page {
  padding: 20px;
  
  .header-card {
    margin-bottom: 20px;
  }
}
</style>
