<template>
  <div class="intelligent-scheduling-page">
    <el-card class="header-card">
      <h2 class="text-2xl font-bold mb-2">
        大模型推理智能调度
      </h2>
      <p class="text-gray-500">
        根据推理容器对加速器类型、数量及显存的需求，进行精确的节点匹配与绑定
      </p>
    </el-card>

    <el-row :gutter="20" class="mt-4">
      <!-- 左侧：调度任务列表 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">调度任务列表</span>
              <el-button type="primary" @click="showCreateDialog = true">
                创建调度任务
              </el-button>
            </div>
          </template>

          <el-table :data="scheduleTasks" stripe>
            <el-table-column prop="taskName" label="任务名称" width="150" />
            <el-table-column label="GPU需求" width="200">
              <template #default="{ row }">
                <div>
                  <div>类型: {{ row.gpuType }}</div>
                  <div>数量: {{ row.gpuCount }} 卡</div>
                  <div>显存: {{ row.memoryRequired }} GB</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="调度状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="matchedNode" label="匹配节点" width="150">
              <template #default="{ row }">
                <span v-if="row.matchedNode" class="text-green-600">
                  {{ row.matchedNode }}
                </span>
                <span v-else class="text-gray-400">等待调度</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'pending'"
                  link
                  type="primary"
                  @click="scheduleTask(row)"
                >
                  执行调度
                </el-button>
                <el-button link type="info" @click="viewTaskDetail(row)">
                  详情
                </el-button>
                <el-popconfirm
                  title="确定要删除此任务吗？"
                  @confirm="deleteTask(row.id)"
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
      </el-col>

      <!-- 右侧：可用节点列表 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <span class="font-bold">可用GPU节点</span>
          </template>

          <div class="node-list">
            <div
              v-for="node in availableNodes"
              :key="node.id"
              class="node-item"
              :class="{ 'node-selected': selectedNode?.id === node.id }"
              @click="selectNode(node)"
            >
              <div class="node-header">
                <span class="font-bold">{{ node.nodeName }}</span>
                <el-tag size="small" :type="getGPUTypeTag(node.gpuType)">
                  {{ node.gpuType }}
                </el-tag>
              </div>
              <div class="node-info mt-2">
                <div class="info-item">
                  <span class="label">可用GPU:</span>
                  <span class="value">{{ node.availableGPUs }}/{{ node.gpuCount }}</span>
                </div>
                <div class="info-item">
                  <span class="label">单卡显存:</span>
                  <span class="value">{{ node.memoryPerGPU }} GB</span>
                </div>
                <div class="info-item">
                  <span class="label">利用率:</span>
                  <el-progress
                    :percentage="node.utilization"
                    :color="getUtilizationColor(node.utilization)"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 创建调度任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建调度任务"
      width="600px"
    >
      <el-form :model="taskForm" label-width="120px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="GPU类型">
          <el-select v-model="taskForm.gpuType" placeholder="请选择GPU类型" style="width: 100%">
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
          <el-input-number v-model="taskForm.gpuCount" :min="1" :max="8" />
        </el-form-item>
        <el-form-item label="显存需求(GB)">
          <el-input-number v-model="taskForm.memoryRequired" :min="16" :max="80" :step="8" />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="taskForm.modelName" placeholder="请输入模型名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createTask">创建</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="调度任务详情"
      width="700px"
    >
      <el-descriptions v-if="currentTask" :column="2" border>
        <el-descriptions-item label="任务名称">{{ currentTask.taskName }}</el-descriptions-item>
        <el-descriptions-item label="模型名称">{{ currentTask.modelName }}</el-descriptions-item>
        <el-descriptions-item label="GPU类型">{{ currentTask.gpuType }}</el-descriptions-item>
        <el-descriptions-item label="GPU数量">{{ currentTask.gpuCount }} 卡</el-descriptions-item>
        <el-descriptions-item label="显存需求">{{ currentTask.memoryRequired }} GB</el-descriptions-item>
        <el-descriptions-item label="匹配节点">
          <span v-if="currentTask.matchedNode" class="text-green-600">{{ currentTask.matchedNode }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="调度状态">
          <el-tag :type="getStatusType(currentTask.status)">
            {{ getStatusText(currentTask.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentTask.createTime }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="currentTask?.scheduleLog" class="mt-4">
        <h3 class="font-bold mb-2">调度日志</h3>
        <el-timeline>
          <el-timeline-item
            v-for="(log, index) in currentTask.scheduleLog"
            :key="index"
            :timestamp="log.time"
            placement="top"
            :type="log.type"
          >
            {{ log.message }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getStorage, setStorage } from '~/utils/storage'

interface ScheduleTask {
  id: string
  taskName: string
  gpuType: string
  gpuCount: number
  memoryRequired: number
  modelName: string
  status: 'pending' | 'scheduled' | 'running' | 'failed'
  matchedNode?: string
  createTime: string
  scheduleLog?: { time: string, message: string, type: string }[]
}

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

const scheduleTasks = ref<ScheduleTask[]>([])
const availableNodes = ref<GPUNode[]>([])
const selectedNode = ref<GPUNode | null>(null)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const currentTask = ref<ScheduleTask | null>(null)

const taskForm = ref({
  taskName: '',
  gpuType: '',
  gpuCount: 1,
  memoryRequired: 80,
  modelName: '',
})

// 初始化数据
function initMockData() {
  const tasks: ScheduleTask[] = [
    {
      id: '1',
      taskName: 'llama2-7b-inference',
      gpuType: 'NVIDIA A100',
      gpuCount: 2,
      memoryRequired: 80,
      modelName: 'Llama-2-7B',
      status: 'scheduled',
      matchedNode: 'gpu-node-01',
      createTime: '2024-01-15 10:30:00',
      scheduleLog: [
        { time: '10:30:00', message: '任务创建成功', type: 'success' },
        { time: '10:30:05', message: '开始匹配节点...', type: 'info' },
        { time: '10:30:08', message: '找到匹配节点: gpu-node-01', type: 'success' },
        { time: '10:30:10', message: '节点绑定成功', type: 'success' },
      ],
    },
    {
      id: '2',
      taskName: 'chatglm-6b-inference',
      gpuType: '昇腾 910B',
      gpuCount: 1,
      memoryRequired: 64,
      modelName: 'ChatGLM-6B',
      status: 'pending',
      createTime: '2024-01-15 11:00:00',
    },
  ]
  return tasks
}

// 方法
function getStatusType(status: string) {
  const map: Record<string, any> = {
    pending: 'info',
    scheduled: 'success',
    running: 'warning',
    failed: 'danger',
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '等待调度',
    scheduled: '已调度',
    running: '运行中',
    failed: '调度失败',
  }
  return map[status] || status
}

function getGPUTypeTag(type: string) {
  if (type.includes('NVIDIA'))
    return 'success'
  if (type.includes('昇腾'))
    return 'warning'
  return 'info'
}

function getUtilizationColor(utilization: number) {
  if (utilization < 30)
    return '#67C23A'
  if (utilization < 70)
    return '#E6A23C'
  return '#F56C6C'
}

function selectNode(node: GPUNode) {
  selectedNode.value = node
}

function createTask() {
  const newTask: ScheduleTask = {
    id: Date.now().toString(),
    ...taskForm.value,
    status: 'pending',
    createTime: new Date().toLocaleString('zh-CN'),
  }
  scheduleTasks.value.unshift(newTask)
  saveToStorage()
  showCreateDialog.value = false
  ElMessage.success('任务创建成功')
  
  // 重置表单
  taskForm.value = {
    taskName: '',
    gpuType: '',
    gpuCount: 1,
    memoryRequired: 80,
    modelName: '',
  }
}

function scheduleTask(task: ScheduleTask) {
  // 智能匹配节点
  const matchedNode = findBestNode(task)
  
  if (matchedNode) {
    task.status = 'scheduled'
    task.matchedNode = matchedNode.nodeName
    task.scheduleLog = [
      { time: new Date().toLocaleTimeString(), message: '开始调度任务', type: 'info' },
      { time: new Date().toLocaleTimeString(), message: `匹配条件: GPU类型=${task.gpuType}, 数量=${task.gpuCount}, 显存=${task.memoryRequired}GB`, type: 'info' },
      { time: new Date().toLocaleTimeString(), message: `找到匹配节点: ${matchedNode.nodeName}`, type: 'success' },
      { time: new Date().toLocaleTimeString(), message: `节点资源: GPU=${matchedNode.gpuType}, 可用=${matchedNode.availableGPUs}卡, 单卡显存=${matchedNode.memoryPerGPU}GB`, type: 'success' },
      { time: new Date().toLocaleTimeString(), message: '调度成功，容器已绑定到节点', type: 'success' },
    ]
    
    // 更新节点可用资源
    matchedNode.availableGPUs -= task.gpuCount
    setStorage('gpu-nodes', availableNodes.value)
    
    saveToStorage()
    ElMessage.success(`调度成功！已绑定到节点: ${matchedNode.nodeName}`)
  }
  else {
    task.status = 'failed'
    task.scheduleLog = [
      { time: new Date().toLocaleTimeString(), message: '开始调度任务', type: 'info' },
      { time: new Date().toLocaleTimeString(), message: '未找到满足条件的节点', type: 'danger' },
      { time: new Date().toLocaleTimeString(), message: '调度失败', type: 'danger' },
    ]
    saveToStorage()
    ElMessage.error('调度失败：未找到满足条件的节点')
  }
}

function findBestNode(task: ScheduleTask): GPUNode | null {
  // 精确匹配：GPU类型、数量、显存
  return availableNodes.value.find(node =>
    node.status === 'online'
    && node.gpuType === task.gpuType
    && node.availableGPUs >= task.gpuCount
    && node.memoryPerGPU >= task.memoryRequired,
  ) || null
}

function viewTaskDetail(task: ScheduleTask) {
  currentTask.value = task
  showDetailDialog.value = true
}

function deleteTask(id: string) {
  scheduleTasks.value = scheduleTasks.value.filter(t => t.id !== id)
  saveToStorage()
  ElMessage.success('删除成功')
}

function saveToStorage() {
  setStorage('schedule-tasks', scheduleTasks.value)
}

function loadFromStorage() {
  const stored = getStorage<ScheduleTask[]>('schedule-tasks', [])
  scheduleTasks.value = stored.length > 0 ? stored : initMockData()
  
  // 加载GPU节点数据
  availableNodes.value = getStorage<GPUNode[]>('gpu-nodes', [])
}

onMounted(() => {
  loadFromStorage()
})
</script>

<style scoped lang="scss">
.intelligent-scheduling-page {
  padding: 20px;
  
  .node-list {
    max-height: 600px;
    overflow-y: auto;
    
    .node-item {
      padding: 15px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
        background-color: #f0f9ff;
      }
      
      &.node-selected {
        border-color: #409eff;
        background-color: #ecf5ff;
      }
      
      .node-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .node-info {
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          
          .label {
            color: #909399;
          }
          
          .value {
            font-weight: 500;
          }
        }
      }
    }
  }
}
</style>
