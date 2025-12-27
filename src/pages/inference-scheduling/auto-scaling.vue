<template>
  <div class="auto-scaling-page p-5">
    <el-card class="header-card">
      <h2 class="text-2xl font-bold mb-2">基于推理指标的弹性扩缩容</h2>
      <p class="text-gray-500">
        支持根据GPU利用率、QPS、TPS、TTFT指标进行弹性扩缩容，以应对高峰流量
      </p>
    </el-card>

    <el-row :gutter="20" class="mt-4">
      <!-- 左侧：扩缩容规则列表 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">扩缩容规则</span>
              <el-button type="primary" @click="showCreateDialog = true"> 创建规则 </el-button>
            </div>
          </template>

          <el-table :data="scalingRules" stripe>
            <el-table-column prop="ruleName" label="规则名称" width="180" />
            <el-table-column prop="serviceName" label="服务名称" width="150" />
            <el-table-column label="扩缩容指标" width="250">
              <template #default="{ row }">
                <div class="text-sm">
                  <div v-if="row.metrics.gpuUtilization">
                    GPU利用率 > {{ row.metrics.gpuUtilization }}%
                  </div>
                  <div v-if="row.metrics.qps">QPS > {{ row.metrics.qps }}</div>
                  <div v-if="row.metrics.tps">TPS > {{ row.metrics.tps }}</div>
                  <div v-if="row.metrics.ttft">TTFT > {{ row.metrics.ttft }}ms</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="副本范围" width="120" align="center">
              <template #default="{ row }">
                {{ row.minReplicas }} - {{ row.maxReplicas }}
              </template>
            </el-table-column>
            <el-table-column label="缩容到0" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.scaleToZero" type="success" size="small"> 支持 </el-tag>
                <el-tag v-else type="info" size="small"> 不支持 </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleRule(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="editRule(row)"> 编辑 </el-button>
                <el-popconfirm title="确定要删除此规则吗？" @confirm="deleteRule(row.id)">
                  <template #reference>
                    <el-button link type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 扩缩容历史 -->
        <el-card class="mt-4">
          <template #header>
            <span class="font-bold">扩缩容历史</span>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="event in scalingEvents"
              :key="event.id"
              :timestamp="event.timestamp"
              :type="event.type"
              placement="top"
            >
              <div class="font-bold">{{ event.serviceName }}</div>
              <div class="text-sm text-gray-600">
                {{ event.action }}：{{ event.fromReplicas }} → {{ event.toReplicas }} 副本
              </div>
              <div class="text-sm text-gray-500">触发原因：{{ event.reason }}</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 右侧：实时监控 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span class="font-bold">实时监控指标</span>
          </template>

          <div class="metrics-panel">
            <div class="metric-item">
              <div class="metric-label">GPU利用率</div>
              <div class="metric-value">
                <el-progress
                  type="dashboard"
                  :percentage="currentMetrics.gpuUtilization"
                  :color="getMetricColor(currentMetrics.gpuUtilization)"
                >
                  <template #default="{ percentage }">
                    <span class="text-2xl font-bold">{{ percentage }}%</span>
                  </template>
                </el-progress>
              </div>
            </div>

            <div class="metric-item mt-4">
              <div class="metric-label">QPS (每秒查询数)</div>
              <div class="metric-value text-3xl font-bold text-blue-600">
                {{ currentMetrics.qps }}
              </div>
            </div>

            <div class="metric-item mt-4">
              <div class="metric-label">TPS (每秒Token数)</div>
              <div class="metric-value text-3xl font-bold text-green-600">
                {{ currentMetrics.tps }}
              </div>
            </div>

            <div class="metric-item mt-4">
              <div class="metric-label">TTFT (首Token时间)</div>
              <div class="metric-value text-3xl font-bold text-purple-600">
                {{ currentMetrics.ttft }} ms
              </div>
            </div>

            <div class="metric-item mt-4">
              <div class="metric-label">当前副本数</div>
              <div class="metric-value text-3xl font-bold text-orange-600">
                {{ currentMetrics.currentReplicas }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 创建/编辑规则对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEditing ? '编辑扩缩容规则' : '创建扩缩容规则'"
      width="700px"
    >
      <el-form :model="ruleForm" label-width="140px">
        <el-form-item label="规则名称">
          <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="服务名称">
          <el-input v-model="ruleForm.serviceName" placeholder="请输入服务名称" />
        </el-form-item>

        <el-divider content-position="left">扩缩容触发指标</el-divider>

        <el-form-item label="GPU利用率阈值(%)">
          <el-input-number v-model="ruleForm.metrics.gpuUtilization" :min="0" :max="100" />
          <span class="ml-2 text-gray-500 text-sm">超过此值触发扩容</span>
        </el-form-item>

        <el-form-item label="QPS阈值">
          <el-input-number v-model="ruleForm.metrics.qps" :min="0" :step="10" />
          <span class="ml-2 text-gray-500 text-sm">超过此值触发扩容</span>
        </el-form-item>

        <el-form-item label="TPS阈值">
          <el-input-number v-model="ruleForm.metrics.tps" :min="0" :step="100" />
          <span class="ml-2 text-gray-500 text-sm">超过此值触发扩容</span>
        </el-form-item>

        <el-form-item label="TTFT阈值(ms)">
          <el-input-number v-model="ruleForm.metrics.ttft" :min="0" :step="50" />
          <span class="ml-2 text-gray-500 text-sm">超过此值触发扩容</span>
        </el-form-item>

        <el-divider content-position="left">副本配置</el-divider>

        <el-form-item label="最小副本数">
          <el-input-number v-model="ruleForm.minReplicas" :min="0" :max="10" />
        </el-form-item>

        <el-form-item label="最大副本数">
          <el-input-number v-model="ruleForm.maxReplicas" :min="1" :max="20" />
        </el-form-item>

        <el-form-item label="支持缩容到0">
          <el-switch v-model="ruleForm.scaleToZero" />
          <span class="ml-2 text-gray-500 text-sm">一段时间无请求后缩容到0</span>
        </el-form-item>

        <el-form-item v-if="ruleForm.scaleToZero" label="缩容等待时间">
          <el-input-number v-model="ruleForm.scaleToZeroTimeout" :min="1" :max="60" />
          <span class="ml-2 text-gray-500 text-sm">分钟</span>
        </el-form-item>

        <el-form-item label="启用规则">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

interface ScalingRule {
  id: string
  ruleName: string
  serviceName: string
  metrics: {
    gpuUtilization?: number
    qps?: number
    tps?: number
    ttft?: number
  }
  minReplicas: number
  maxReplicas: number
  scaleToZero: boolean
  scaleToZeroTimeout?: number
  enabled: boolean
}

interface ScalingEvent {
  id: string
  serviceName: string
  action: string
  fromReplicas: number
  toReplicas: number
  reason: string
  timestamp: string
  type: 'success' | 'warning' | 'danger' | 'info'
}

const scalingRules = ref<ScalingRule[]>([])
const scalingEvents = ref<ScalingEvent[]>([])
const showCreateDialog = ref(false)
const isEditing = ref(false)

const currentMetrics = ref({
  gpuUtilization: 65,
  qps: 120,
  tps: 850,
  ttft: 180,
  currentReplicas: 3,
})

const ruleForm = ref<Partial<ScalingRule>>({
  ruleName: '',
  serviceName: '',
  metrics: {
    gpuUtilization: 80,
    qps: 100,
    tps: 1000,
    ttft: 200,
  },
  minReplicas: 1,
  maxReplicas: 10,
  scaleToZero: true,
  scaleToZeroTimeout: 10,
  enabled: true,
})

let metricsInterval: number

// 初始化Mock数据
function initMockData() {
  const rules: ScalingRule[] = [
    {
      id: '1',
      ruleName: 'llama2-auto-scaling',
      serviceName: 'llama2-7b-service',
      metrics: {
        gpuUtilization: 80,
        qps: 100,
        ttft: 200,
      },
      minReplicas: 1,
      maxReplicas: 10,
      scaleToZero: true,
      scaleToZeroTimeout: 10,
      enabled: true,
    },
    {
      id: '2',
      ruleName: 'chatglm-auto-scaling',
      serviceName: 'chatglm-6b-service',
      metrics: {
        gpuUtilization: 75,
        tps: 1000,
      },
      minReplicas: 2,
      maxReplicas: 8,
      scaleToZero: false,
      enabled: true,
    },
  ]

  const events: ScalingEvent[] = [
    {
      id: '1',
      serviceName: 'llama2-7b-service',
      action: '扩容',
      fromReplicas: 2,
      toReplicas: 3,
      reason: 'GPU利用率达到85%，超过阈值80%',
      timestamp: '2024-01-15 14:30:00',
      type: 'success',
    },
    {
      id: '2',
      serviceName: 'chatglm-6b-service',
      action: '扩容',
      fromReplicas: 2,
      toReplicas: 4,
      reason: 'QPS达到150，超过阈值100',
      timestamp: '2024-01-15 13:15:00',
      type: 'success',
    },
    {
      id: '3',
      serviceName: 'llama2-7b-service',
      action: '缩容',
      fromReplicas: 3,
      toReplicas: 1,
      reason: '10分钟无请求，触发缩容到0',
      timestamp: '2024-01-15 11:00:00',
      type: 'info',
    },
  ]

  return { rules, events }
}

// 模拟实时指标变化
function simulateMetrics() {
  metricsInterval = window.setInterval(() => {
    currentMetrics.value.gpuUtilization = Math.floor(Math.random() * 40 + 50) // 50-90
    currentMetrics.value.qps = Math.floor(Math.random() * 100 + 80) // 80-180
    currentMetrics.value.tps = Math.floor(Math.random() * 500 + 600) // 600-1100
    currentMetrics.value.ttft = Math.floor(Math.random() * 100 + 150) // 150-250
  }, 3000)
}

function getMetricColor(value: number): string {
  if (value < 50) return '#67C23A'
  if (value < 80) return '#E6A23C'
  return '#F56C6C'
}

function editRule(rule: ScalingRule) {
  isEditing.value = true
  ruleForm.value = { ...rule }
  showCreateDialog.value = true
}

function saveRule() {
  if (isEditing.value && ruleForm.value.id) {
    const index = scalingRules.value.findIndex((r) => r.id === ruleForm.value.id)
    if (index !== -1) {
      scalingRules.value[index] = { ...(ruleForm.value as ScalingRule) }
    }
  } else {
    const newRule: ScalingRule = {
      ...(ruleForm.value as ScalingRule),
      id: Date.now().toString(),
    }
    scalingRules.value.push(newRule)
  }

  saveToStorage()
  showCreateDialog.value = false
  resetForm()
  ElMessage.success(isEditing.value ? '规则更新成功' : '规则创建成功')
}

function deleteRule(id: string) {
  scalingRules.value = scalingRules.value.filter((r) => r.id !== id)
  saveToStorage()
  ElMessage.success('规则删除成功')
}

function toggleRule(rule: ScalingRule) {
  saveToStorage()
  ElMessage.success(rule.enabled ? '规则已启用' : '规则已禁用')
}

function resetForm() {
  isEditing.value = false
  ruleForm.value = {
    ruleName: '',
    serviceName: '',
    metrics: {
      gpuUtilization: 80,
      qps: 100,
      tps: 1000,
      ttft: 200,
    },
    minReplicas: 1,
    maxReplicas: 10,
    scaleToZero: true,
    scaleToZeroTimeout: 10,
    enabled: true,
  }
}

function saveToStorage() {
  localStorage.setItem('scaling-rules', JSON.stringify(scalingRules.value))
  localStorage.setItem('scaling-events', JSON.stringify(scalingEvents.value))
}

function loadFromStorage() {
  const storedRules = localStorage.getItem('scaling-rules')
  const storedEvents = localStorage.getItem('scaling-events')

  if (
    !storedRules ||
    !storedEvents ||
    JSON.parse(storedRules).length === 0 ||
    JSON.parse(storedEvents).length === 0
  ) {
    const mockData = initMockData()
    scalingRules.value = mockData.rules
    scalingEvents.value = mockData.events
    saveToStorage()
  } else {
    scalingRules.value = JSON.parse(storedRules)
    scalingEvents.value = JSON.parse(storedEvents)
  }
}

onMounted(() => {
  loadFromStorage()
  simulateMetrics()
})

onUnmounted(() => {
  if (metricsInterval) {
    clearInterval(metricsInterval)
  }
})
</script>

<style scoped lang="scss">
.auto-scaling-page {
  .metrics-panel {
    .metric-item {
      padding: 15px;
      background: #f5f7fa;
      border-radius: 8px;

      .metric-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 10px;
      }

      .metric-value {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }
}
</style>
