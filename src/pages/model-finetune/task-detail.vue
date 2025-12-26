<template>
  <div class="task-detail-page">
    <el-page-header @back="goBack">
      <template #content>
        <span class="text-2xl font-bold">{{ task?.taskName }}</span>
      </template>
    </el-page-header>

    <el-card v-if="task" class="mt-4">
      <el-tabs v-model="activeTab">
        <!-- 概览信息 -->
        <el-tab-pane label="概览信息" name="overview">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务名称">{{ task.taskName }}</el-descriptions-item>
            <el-descriptions-item label="任务状态">
              <el-tag :type="getStatusType(task.status)">
                {{ getStatusText(task.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="基座模型">{{ task.baseModel }}</el-descriptions-item>
            <el-descriptions-item label="数据集">{{ task.dataset }}</el-descriptions-item>
            <el-descriptions-item label="Learning Rate">{{ task.learningRate }}</el-descriptions-item>
            <el-descriptions-item label="Epochs">{{ task.epochs }}</el-descriptions-item>
            <el-descriptions-item label="Batch Size">{{ task.batchSize }}</el-descriptions-item>
            <el-descriptions-item label="LoRA Rank">{{ task.loraRank }}</el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">{{ task.createTime }}</el-descriptions-item>
            <el-descriptions-item label="任务描述" :span="2">{{ task.description }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="task.status === 'running'" class="mt-4">
            <h3 class="font-bold mb-2">训练进度</h3>
            <el-progress :percentage="task.progress" :status="task.progress === 100 ? 'success' : ''" />
          </div>
        </el-tab-pane>

        <!-- 效果指标 -->
        <el-tab-pane label="效果指标" name="metrics">
          <el-table :data="metricsData" border>
            <el-table-column prop="metric" label="指标" width="150" />
            <el-table-column prop="value" label="数值" align="center" />
            <el-table-column prop="description" label="说明" />
          </el-table>

          <div class="mt-4">
            <h3 class="font-bold mb-3">训练曲线</h3>
            <el-empty description="训练曲线图表区域（可接入ECharts）" />
          </div>
        </el-tab-pane>

        <!-- 日志 -->
        <el-tab-pane label="日志" name="logs">
          <div class="log-viewer">
            <div v-for="(log, index) in logs" :key="index" class="log-line">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-content">{{ log.content }}</span>
            </div>
          </div>
        </el-tab-pane>

        <!-- 模型产出 -->
        <el-tab-pane label="模型产出" name="output">
          <div v-if="task.status === 'completed'">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="产出模型">{{ task.taskName }}-lora</el-descriptions-item>
              <el-descriptions-item label="模型大小">256 MB</el-descriptions-item>
              <el-descriptions-item label="保存路径">/models/{{ task.taskName }}/</el-descriptions-item>
              <el-descriptions-item label="产出时间">{{ task.createTime }}</el-descriptions-item>
            </el-descriptions>

            <div class="mt-4 flex gap-3">
              <el-button type="primary" @click="startEvaluation">
                发起评测
              </el-button>
              <el-button @click="tryModel">
                立即体验
              </el-button>
              <el-button>
                下载模型
              </el-button>
            </div>
          </div>
          <el-empty v-else description="任务完成后可查看模型产出" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStorage, setStorage } from '~/utils/storage'

const router = useRouter()
const task = ref<any>(null)
const activeTab = ref('overview')

const metricsData = ref([
  { metric: 'Training Loss', value: '0.352', description: '训练损失' },
  { metric: 'Validation Loss', value: '0.428', description: '验证损失' },
  { metric: 'Perplexity', value: '12.5', description: '困惑度' },
  { metric: 'BLEU Score', value: '0.76', description: '翻译质量评分' },
])

const logs = ref([
  { time: '14:30:00', content: '[INFO] 开始加载基座模型...' },
  { time: '14:30:15', content: '[INFO] 模型加载完成' },
  { time: '14:30:20', content: '[INFO] 开始加载训练数据集...' },
  { time: '14:30:25', content: '[INFO] 数据集加载完成，共10000条样本' },
  { time: '14:30:30', content: '[INFO] 初始化LoRA配置...' },
  { time: '14:30:35', content: '[INFO] 开始训练 Epoch 1/3' },
  { time: '14:31:00', content: '[INFO] Epoch 1/3 - Loss: 0.521' },
  { time: '14:32:00', content: '[INFO] Epoch 2/3 - Loss: 0.398' },
  { time: '14:33:00', content: '[INFO] Epoch 3/3 - Loss: 0.352' },
  { time: '14:33:30', content: '[INFO] 训练完成，保存模型...' },
])

function getStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
  }
  return map[status] || status
}

function goBack() {
  router.back()
}

function startEvaluation() {
  setStorage('eval-model', task.value)
  router.push('/model-evaluation/create-task')
  ElMessage.success('跳转到模型评测页面')
}

function tryModel() {
  router.push('/model-marketplace/playground')
  ElMessage.success('跳转到在线体验页面')
}

onMounted(() => {
  task.value = getStorage('current-finetune-task', null)
})
</script>

<style scoped lang="scss">
.task-detail-page {
  padding: 20px;

  .log-viewer {
    background: #000;
    color: #0f0;
    padding: 15px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    max-height: 500px;
    overflow-y: auto;

    .log-line {
      margin-bottom: 5px;

      .log-time {
        color: #888;
        margin-right: 10px;
      }
    }
  }
}
</style>
