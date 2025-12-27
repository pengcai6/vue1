<template>
  <div class="evaluation-task-list-page p-5">
    <el-card class="header-card">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">测评任务列表</h2>
        <el-button type="primary" @click="$router.push('/model-evaluation/create-task')">
          创建测评任务
        </el-button>
      </div>
    </el-card>

    <el-card class="mt-4">
      <el-table :data="tasks" stripe>
        <el-table-column prop="taskName" label="任务名称" width="200" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="测评模型" width="200">
          <template #default="{ row }">
            {{ row.models.join(', ') }}
          </template>
        </el-table-column>
        <el-table-column label="数据集" width="200">
          <template #default="{ row }">
            {{ row.datasets.join(', ') }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'warning'">
              {{ row.status === 'completed' ? '已完成' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewResults(row)"> 查看结果 </el-button>
            <el-popconfirm title="确定删除?" @confirm="deleteTask(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const tasks = ref<any[]>([])

function initMockData() {
  return [
    {
      id: '1',
      taskName: 'llm-benchmark-test',
      description: '大语言模型基准测试',
      models: ['llama-2-7b', 'chatglm-6b'],
      datasets: ['mmlu', 'c-eval', 'gsm8k'],
      metrics: ['accuracy'],
      status: 'completed',
      createTime: '2024-01-15 10:00:00',
    },
  ]
}

function viewResults(task: any) {
  localStorage.setItem('current-eval-task', JSON.stringify(task))
  router.push('/model-evaluation/evaluation-results')
}

function deleteTask(id: string) {
  tasks.value = tasks.value.filter((t) => t.id !== id)
  localStorage.setItem('evaluation-tasks', JSON.stringify(tasks.value))
  ElMessage.success('删除成功')
}

onMounted(() => {
  const stored = localStorage.getItem('evaluation-tasks')
  tasks.value = stored ? JSON.parse(stored) : initMockData()
})
</script>
