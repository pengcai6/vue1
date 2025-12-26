<template>
  <div class="service-monitoring-page">
    <!-- 服务选择 -->
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true">
        <el-form-item label="选择服务">
          <el-select v-model="selectedService" placeholder="请选择服务" @change="handleServiceChange" style="width: 200px">
            <el-option
              v-for="service in services"
              :key="service.id"
              :label="service.name"
              :value="service.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-select v-model="timeRange" @change="handleTimeRangeChange" style="width: 150px">
            <el-option label="最近1小时" value="1h" />
            <el-option label="最近6小时" value="6h" />
            <el-option label="最近24小时" value="24h" />
            <el-option label="最近7天" value="7d" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 服务状态总览 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="服务状态">
            <template #default>
              <el-tag :type="currentServiceStatus.status === 'running' ? 'success' : 'danger'" size="large">
                {{ currentServiceStatus.status === 'running' ? '运行中' : '异常' }}
              </el-tag>
            </template>
          </el-statistic>
          <div class="status-detail">
            <div>副本数: {{ currentServiceStatus.replicas }}/{{ currentServiceStatus.desiredReplicas }}</div>
            <div>运行时长: {{ currentServiceStatus.uptime }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="实时QPS" :value="realTimeMetrics.qps">
            <template #suffix>req/s</template>
          </el-statistic>
          <div class="metric-detail">
            <span :style="{ color: getTrendColor(realTimeMetrics.qpsTrend) }">
              {{ realTimeMetrics.qpsTrend > 0 ? '↑' : '↓' }} {{ Math.abs(realTimeMetrics.qpsTrend) }}%
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="平均延迟" :value="realTimeMetrics.avgLatency">
            <template #suffix>ms</template>
          </el-statistic>
          <div class="metric-detail">
            <span :style="{ color: getLatencyColor(realTimeMetrics.avgLatency) }">
              P99: {{ realTimeMetrics.p99Latency }}ms
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="成功率" :value="realTimeMetrics.successRate" :precision="2">
            <template #suffix>%</template>
          </el-statistic>
          <div class="metric-detail">
            <span :style="{ color: getSuccessRateColor(realTimeMetrics.successRate) }">
              错误数: {{ realTimeMetrics.errorCount }}
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 性能指标图表 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">QPS趋势</span>
            </div>
          </template>
          <div ref="qpsTrendChartRef" style="width: 100%; height: 280px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">延迟分布</span>
            </div>
          </template>
          <div ref="latencyDistChartRef" style="width: 100%; height: 280px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">GPU利用率</span>
            </div>
          </template>
          <div ref="gpuUtilChartRef" style="width: 100%; height: 280px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">Token吞吐量</span>
            </div>
          </template>
          <div ref="tokenThroughputChartRef" style="width: 100%; height: 280px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资源使用情况 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span class="title">资源使用情况</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="resource-item">
            <div class="resource-label">GPU使用率</div>
            <el-progress
              :percentage="resourceUsage.gpu"
              :color="getProgressColor(resourceUsage.gpu)"
              :stroke-width="20"
            />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="resource-item">
            <div class="resource-label">内存使用率</div>
            <el-progress
              :percentage="resourceUsage.memory"
              :color="getProgressColor(resourceUsage.memory)"
              :stroke-width="20"
            />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="resource-item">
            <div class="resource-label">CPU使用率</div>
            <el-progress
              :percentage="resourceUsage.cpu"
              :color="getProgressColor(resourceUsage.cpu)"
              :stroke-width="20"
            />
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 详细指标表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">Pod实例监控</span>
        </div>
      </template>
      <el-table :data="podMetrics" border style="width: 100%" :scrollbar-always-on="true">
        <el-table-column prop="podName" label="Pod名称" min-width="280" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'Running' ? 'success' : 'danger'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="qps" label="QPS" width="110" align="center">
          <template #default="{ row }">
            {{ row.qps }} req/s
          </template>
        </el-table-column>
        <el-table-column prop="avgLatency" label="平均延迟" width="120" align="center">
          <template #default="{ row }">
            <span :style="{ color: getLatencyColor(row.avgLatency) }">{{ row.avgLatency }}ms</span>
          </template>
        </el-table-column>
        <el-table-column prop="gpuUtil" label="GPU利用率" width="140" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center;">
              <el-progress :percentage="row.gpuUtil" :stroke-width="6" style="width: 60px;" />
              <span style="margin-left: 8px; white-space: nowrap;">{{ row.gpuUtil }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="memoryUtil" label="内存利用率" width="140" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center;">
              <el-progress :percentage="row.memoryUtil" :stroke-width="6" style="width: 60px;" />
              <span style="margin-left: 8px; white-space: nowrap;">{{ row.memoryUtil }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="requests" label="请求数" width="110" align="right">
          <template #default="{ row }">
            {{ row.requests.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="errors" label="错误数" width="100" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.errors > 0 ? '#f56c6c' : '#67c23a' }">
              {{ row.errors }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="uptime" label="运行时长" width="130" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

interface Service {
  id: string
  name: string
}

interface ServiceStatus {
  status: 'running' | 'error'
  replicas: number
  desiredReplicas: number
  uptime: string
}

interface PodMetric {
  podName: string
  status: string
  qps: number
  avgLatency: number
  gpuUtil: number
  memoryUtil: number
  requests: number
  errors: number
  uptime: string
}

// 服务列表
const services = ref<Service[]>([
  { id: 'service-001', name: 'qwen-chat-api' },
  { id: 'service-002', name: 'deepseek-inference' },
  { id: 'service-003', name: 'glm-service' },
])

const selectedService = ref('service-001')
const timeRange = ref('1h')

// 服务状态
const currentServiceStatus = ref<ServiceStatus>({
  status: 'running',
  replicas: 3,
  desiredReplicas: 3,
  uptime: '15天 8小时',
})

// 实时指标
const realTimeMetrics = ref({
  qps: 245,
  qpsTrend: 12.5,
  avgLatency: 1234,
  p99Latency: 2567,
  successRate: 99.2,
  errorCount: 23,
})

// 资源使用
const resourceUsage = ref({
  gpu: 78,
  memory: 65,
  cpu: 42,
})

// Pod指标
const podMetrics = ref<PodMetric[]>([
  {
    podName: 'qwen-chat-api-deployment-7d9f8b6c5-abc12',
    status: 'Running',
    qps: 82,
    avgLatency: 1189,
    gpuUtil: 75,
    memoryUtil: 62,
    requests: 145678,
    errors: 8,
    uptime: '15天 8小时',
  },
  {
    podName: 'qwen-chat-api-deployment-7d9f8b6c5-def34',
    status: 'Running',
    qps: 85,
    avgLatency: 1256,
    gpuUtil: 79,
    memoryUtil: 67,
    requests: 152341,
    errors: 9,
    uptime: '15天 8小时',
  },
  {
    podName: 'qwen-chat-api-deployment-7d9f8b6c5-ghi56',
    status: 'Running',
    qps: 78,
    avgLatency: 1267,
    gpuUtil: 80,
    memoryUtil: 66,
    requests: 138954,
    errors: 6,
    uptime: '15天 8小时',
  },
])

// 图表引用
const qpsTrendChartRef = ref()
const latencyDistChartRef = ref()
const gpuUtilChartRef = ref()
const tokenThroughputChartRef = ref()

// 图表实例
let qpsTrendChart: echarts.ECharts | null = null
let latencyDistChart: echarts.ECharts | null = null
let gpuUtilChart: echarts.ECharts | null = null
let tokenThroughputChart: echarts.ECharts | null = null

// 服务切换
const handleServiceChange = () => {
  ElMessage.success('已切换服务')
  initCharts()
}

// 时间范围切换
const handleTimeRangeChange = () => {
  ElMessage.success('已更新时间范围')
  initCharts()
}

// 刷新
const handleRefresh = () => {
  ElMessage.success('数据已刷新')
  initCharts()
}

// 初始化图表
const initCharts = async () => {
  await nextTick()

  // QPS趋势图
  if (qpsTrendChartRef.value) {
    qpsTrendChart = echarts.init(qpsTrendChartRef.value)
    qpsTrendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
      },
      yAxis: { type: 'value', name: 'req/s' },
      series: [
        {
          name: 'QPS',
          type: 'line',
          smooth: true,
          data: [156, 189, 234, 278, 312, 289, 245],
          itemStyle: { color: '#409eff' },
          areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
        },
      ],
    })
  }

  // 延迟分布图
  if (latencyDistChartRef.value) {
    latencyDistChart = echarts.init(latencyDistChartRef.value)
    latencyDistChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['P50', 'P90', 'P99'], top: '0%' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
      },
      yAxis: { type: 'value', name: 'ms' },
      series: [
        {
          name: 'P50',
          type: 'line',
          smooth: true,
          data: [892, 945, 1023, 1156, 1234, 1178, 1089],
          itemStyle: { color: '#67c23a' },
        },
        {
          name: 'P90',
          type: 'line',
          smooth: true,
          data: [1456, 1523, 1678, 1823, 1945, 1867, 1734],
          itemStyle: { color: '#e6a23c' },
        },
        {
          name: 'P99',
          type: 'line',
          smooth: true,
          data: [2134, 2267, 2456, 2678, 2834, 2723, 2567],
          itemStyle: { color: '#f56c6c' },
        },
      ],
    })
  }

  // GPU利用率图
  if (gpuUtilChartRef.value) {
    gpuUtilChart = echarts.init(gpuUtilChartRef.value)
    gpuUtilChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '50px', right: '50px', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
      },
      yAxis: { type: 'value', name: '%', max: 100 },
      series: [
        {
          name: 'GPU利用率',
          type: 'line',
          smooth: true,
          data: [68, 72, 75, 82, 85, 81, 78],
          itemStyle: { color: '#e6a23c' },
          areaStyle: { color: 'rgba(230, 162, 60, 0.2)' },
          markLine: {
            data: [{ type: 'average', name: '平均值' }],
            lineStyle: { color: '#f56c6c', type: 'dashed' },
            label: {
              show: true,
              position: 'insideEndTop',
              formatter: '平均值: {c}%',
            },
          },
        },
      ],
    })
  }

  // Token吞吐量图
  if (tokenThroughputChartRef.value) {
    tokenThroughputChart = echarts.init(tokenThroughputChartRef.value)
    tokenThroughputChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['输入TPS', '输出TPS'], top: '0%' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
      },
      yAxis: { type: 'value', name: 'tokens/s' },
      series: [
        {
          name: '输入TPS',
          type: 'bar',
          data: [3456, 3678, 4123, 4567, 4890, 4623, 4234],
          itemStyle: { color: '#67c23a' },
        },
        {
          name: '输出TPS',
          type: 'bar',
          data: [8923, 9456, 10345, 11234, 12056, 11678, 10789],
          itemStyle: { color: '#409eff' },
        },
      ],
    })
  }
}

// 工具函数
const getTrendColor = (trend: number) => {
  return trend > 0 ? '#67c23a' : '#f56c6c'
}

const getLatencyColor = (latency: number) => {
  if (latency < 1000) return '#67c23a'
  if (latency < 2000) return '#e6a23c'
  return '#f56c6c'
}

const getSuccessRateColor = (rate: number) => {
  if (rate >= 99) return '#67c23a'
  if (rate >= 95) return '#e6a23c'
  return '#f56c6c'
}

const getProgressColor = (percentage: number) => {
  if (percentage < 70) return '#67c23a'
  if (percentage < 85) return '#e6a23c'
  return '#f56c6c'
}

// 响应式调整
const handleResize = () => {
  qpsTrendChart?.resize()
  latencyDistChart?.resize()
  gpuUtilChart?.resize()
  tokenThroughputChart?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

// 清理
const onUnmounted = () => {
  window.removeEventListener('resize', handleResize)
  qpsTrendChart?.dispose()
  latencyDistChart?.dispose()
  gpuUtilChart?.dispose()
  tokenThroughputChart?.dispose()
}
</script>

<style scoped lang="scss">
.service-monitoring-page {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .status-detail {
    margin-top: 12px;
    font-size: 13px;
    color: #606266;

    div {
      margin-top: 4px;
    }
  }

  .metric-detail {
    margin-top: 12px;
    font-size: 13px;
  }

  .resource-item {
    margin-bottom: 16px;

    .resource-label {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
      font-weight: 500;
    }
  }
}
</style>
