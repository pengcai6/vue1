<template>
  <div class="service-monitoring-page">
    <!-- 服务选择 -->
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true">
        <el-form-item label="选择服务">
          <el-select
            v-model="selectedService"
            placeholder="请选择服务"
            @change="handleServiceChange"
            style="width: 200px"
          >
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
              <el-tag
                :type="currentServiceStatus.status === 'running' ? 'success' : 'danger'"
                size="large"
              >
                {{ currentServiceStatus.status === 'running' ? '运行中' : '异常' }}
              </el-tag>
            </template>
          </el-statistic>
          <div class="status-detail">
            <div>
              副本数: {{ currentServiceStatus.replicas }}/{{ currentServiceStatus.desiredReplicas }}
            </div>
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
              {{ realTimeMetrics.qpsTrend > 0 ? '↑' : '↓' }}
              {{ Math.abs(realTimeMetrics.qpsTrend) }}%
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
            <span
              style="margin-left: 8px"
              :style="{ color: getLatencyColor(realTimeMetrics.avgLatency) }"
            >
              P95: {{ realTimeMetrics.p95Latency }}ms
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
              <span class="title">性能分位指标</span>
            </div>
          </template>
          <el-tabs v-model="activeMetric" @tab-change="handleMetricTabChange">
            <el-tab-pane label="TTFT" name="ttft" />
            <el-tab-pane label="OTPS" name="otps" />
            <el-tab-pane label="TPOT" name="tpot" />
            <el-tab-pane label="E2E Latency" name="latency" />
          </el-tabs>
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
          <template #default="{ row }"> {{ row.qps }} req/s </template>
        </el-table-column>
        <el-table-column prop="avgLatency" label="平均延迟" width="120" align="center">
          <template #default="{ row }">
            <span :style="{ color: getLatencyColor(row.avgLatency) }">{{ row.avgLatency }}ms</span>
          </template>
        </el-table-column>
        <el-table-column prop="gpuUtil" label="GPU利用率" width="140" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center">
              <el-progress :percentage="row.gpuUtil" :stroke-width="6" style="width: 60px" />
              <span style="margin-left: 8px; white-space: nowrap">{{ row.gpuUtil }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="memoryUtil" label="内存利用率" width="140" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: center">
              <el-progress :percentage="row.memoryUtil" :stroke-width="6" style="width: 60px" />
              <span style="margin-left: 8px; white-space: nowrap">{{ row.memoryUtil }}%</span>
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
  p95Latency: 1850,
  successRate: 99.2,
  errorCount: 23,
})

const activeMetric = ref<'ttft' | 'otps' | 'tpot' | 'latency'>('ttft')

const percentileSeries = {
  ttft: {
    unit: 'ms',
    data: {
      Avg: [150, 160, 175, 190, 205, 195, 180],
      P50: [140, 150, 162, 175, 188, 180, 170],
      P90: [200, 215, 235, 255, 270, 260, 245],
      P95: [230, 245, 265, 285, 305, 295, 280],
      P99: [320, 340, 360, 380, 400, 390, 370],
    },
  },
  otps: {
    unit: 'tokens/s',
    data: {
      Avg: [45, 48, 52, 55, 58, 56, 50],
      P50: [48, 50, 54, 58, 60, 58, 52],
      P90: [35, 38, 42, 45, 48, 46, 40],
      P95: [30, 34, 38, 42, 45, 43, 38],
      P99: [20, 22, 26, 30, 32, 30, 26],
    },
  },
  tpot: {
    unit: 'ms/token',
    data: {
      Avg: [25, 26, 27, 29, 31, 30, 28],
      P50: [22, 23, 24, 26, 28, 27, 25],
      P90: [30, 32, 34, 36, 38, 37, 35],
      P95: [35, 37, 39, 42, 44, 43, 41],
      P99: [45, 47, 49, 52, 54, 53, 50],
    },
  },
  latency: {
    unit: 'ms',
    data: {
      Avg: [1200, 1250, 1320, 1400, 1480, 1420, 1350],
      P50: [892, 945, 1023, 1156, 1234, 1178, 1089],
      P90: [1456, 1523, 1678, 1823, 1945, 1867, 1734],
      P95: [1680, 1760, 1890, 2040, 2190, 2080, 1950],
      P99: [2134, 2267, 2456, 2678, 2834, 2723, 2567],
    },
  },
} as const

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

const handleMetricTabChange = () => {
  renderPercentileChart(activeMetric.value)
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

  // Performance percentiles (TTFT/OTPS/TPOT/E2E)
  renderPercentileChart(activeMetric.value)

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

// 性能分位图渲染
const renderPercentileChart = (metricKey: keyof typeof percentileSeries) => {
  if (!latencyDistChartRef.value) return
  if (!latencyDistChart) {
    latencyDistChart = echarts.init(latencyDistChartRef.value)
  }
  const config = percentileSeries[metricKey]
  const labels = Object.keys(config.data)
  const palette = ['#409eff', '#67c23a', '#e6a23c', '#f6c343', '#f56c6c']
  const series = labels.map((name, idx) => ({
    name,
    type: 'line',
    smooth: true,
    data: config.data[name as keyof typeof config.data],
    itemStyle: { color: palette[idx % palette.length] },
  }))

  latencyDistChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: labels, top: '0%' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
    },
    yAxis: { type: 'value', name: config.unit },
    series,
  })
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
