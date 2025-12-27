<template>
  <div class="task-list-page p-5">
    <el-card class="header-card">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">微调任务列表</h2>
        <el-button type="primary" @click="createNew"> 创建微调任务 </el-button>
      </div>
    </el-card>

    <el-card class="mt-4">
      <el-table :data="tasks" stripe>
        <el-table-column prop="taskName" label="任务名称" width="200" />
        <el-table-column
          prop="description"
          label="任务描述"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="baseModel" label="基座模型" width="150" />
        <el-table-column prop="dataset" label="数据集" width="180" />
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="180">
          <template #default="{ row }">
            <el-progress
              v-if="row.status === 'running'"
              :percentage="row.progress"
              :status="row.progress === 100 ? 'success' : ''"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)"> 详情 </el-button>
            <el-button v-if="row.status === 'pending'" link type="success" @click="startTask(row)">
              启动
            </el-button>
            <el-button v-if="row.status === 'running'" link type="warning" @click="stopTask(row)">
              停止
            </el-button>
            <el-button link @click="copyTask(row)"> 复制 </el-button>
            <el-popconfirm title="确定要删除此任务吗？" @confirm="deleteTask(row.id)">
              <template #reference>
                <el-button link type="danger"> 删除 </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const tasks = ref<any[]>([])
let progressInterval: number

function initMockData() {
  return [
    {
      id: '1',
      taskName: 'llama2-customer-service',
      description: '客服对话微调任务',
      baseModel: 'llama-2-7b',
      dataset: 'custom-chat-v1',
      status: 'completed',
      progress: 100,
      createTime: '2024-01-15 10:00:00',
      learningRate: 0.0001,
      epochs: 3,
    },
    {
      id: '2',
      taskName: 'chatglm-financial',
      description: '金融领域微调',
      baseModel: 'chatglm-6b',
      dataset: 'finance-dataset',
      status: 'running',
      progress: 65,
      createTime: '2024-01-15 14:30:00',
      learningRate: 0.0002,
      epochs: 5,
    },
    {
      id: '3',
      taskName: 'qwen-code-generation',
      description: '代码生成微调任务',
      baseModel: 'qwen-7b',
      dataset: 'code-alpaca-v1',
      status: 'completed',
      progress: 100,
      createTime: '2024-01-14 09:00:00',
      learningRate: 0.0003,
      epochs: 4,
    },
  ]
}

function getStatusType(status: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return map[status] || 'info'
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
  }
  return map[status] || status
}

function createNew() {
  router.push('/model-finetune/create-task')
}

function viewDetail(task: any) {
  localStorage.setItem('current-finetune-task', JSON.stringify(task))
  router.push('/model-finetune/task-detail')
}

function startTask(task: any) {
  task.status = 'running'
  task.progress = 0
  saveToStorage()
  ElMessage.success('任务已启动')
}

function stopTask(task: any) {
  task.status = 'pending'
  saveToStorage()
  ElMessage.warning('任务已停止')
}

function copyTask(task: any) {
  const newTask = {
    ...task,
    id: Date.now().toString(),
    taskName: `${task.taskName}-copy`,
    status: 'pending',
    progress: 0,
    createTime: new Date().toLocaleString(),
  }
  tasks.value.unshift(newTask)
  saveToStorage()
  ElMessage.success('任务已复制')
}

function deleteTask(id: string) {
  tasks.value = tasks.value.filter((t) => t.id !== id)
  saveToStorage()
  ElMessage.success('任务已删除')
}

function saveToStorage() {
  localStorage.setItem('finetune-tasks', JSON.stringify(tasks.value))
}

function loadFromStorage() {
  const stored = localStorage.getItem('finetune-tasks')
  tasks.value = stored ? JSON.parse(stored) : initMockData()
}

// 模拟进度更新
function simulateProgress() {
  progressInterval = window.setInterval(() => {
    tasks.value.forEach((task) => {
      if (task.status === 'running' && task.progress < 100) {
        task.progress = Math.min(task.progress + Math.floor(Math.random() * 5 + 1), 100)
        if (task.progress === 100) {
          task.status = 'completed'
        }
      }
    })
    saveToStorage()
  }, 2000)
}

onMounted(() => {
  loadFromStorage()
  simulateProgress()
})

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})
</script>
