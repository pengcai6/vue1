<template>
  <div class="performance-monitoring-page">
    <el-page-header @back="$router.back()">
      <template #content>
        <span class="text-2xl font-bold">性能监控</span>
      </template>
    </el-page-header>

    <!-- 筛选栏 -->
    <el-card class="mt-4">
      <el-form :inline="true" :model="filters">
        <el-form-item label="组织">
          <el-select
            v-model="filters.organization"
            placeholder="全部组织"
            clearable
            style="width: 160px"
          >
            <el-option label="研发部" value="dev" />
            <el-option label="市场部" value="marketing" />
            <el-option label="产品部" value="product" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型服务">
          <el-select v-model="filters.model" placeholder="全部模型" clearable style="width: 160px">
            <el-option label="Qwen2.5-72B" value="qwen" />
            <el-option label="DeepSeek-V3" value="deepseek" />
            <el-option label="Llama-3-70B" value="llama" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item label="时间粒度">
          <el-radio-group v-model="filters.granularity">
            <el-radio-button label="minute">分钟</el-radio-button>
            <el-radio-button label="hour">小时</el-radio-button>
            <el-radio-button label="day">天</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 调用量指标卡片 -->
    <el-row :gutter="16" class="mt-4">
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="metric-card">
          <el-statistic title="总调用次" :value="metrics.totalCalls" />
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="metric-card">
          <el-statistic
            title="失败次"
            :value="metrics.failedCalls"
            value-style="color: var(--el-color-danger)"
          />
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="metric-card">
          <el-statistic title="失败率" :value="metrics.failureRate" suffix="%" />
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="metric-card">
          <el-statistic title="总Token" :value="metrics.totalTokens" />
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="metric-card">
          <el-statistic title="输入Token" :value="metrics.inputTokens" />
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="metric-card">
          <el-statistic title="输出Token" :value="metrics.outputTokens" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 性能指标概览 (P95) -->
    <el-row :gutter="16">
      <el-col :xs="12" :sm="8" :md="6">
        <el-card shadow="hover" class="metric-card">
          <el-statistic title="TTFT P95" :value="metrics.p95TTFT" suffix="ms" />
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="6">
        <el-card shadow="hover" class="metric-card">
          <el-statistic title="TPOT P95" :value="metrics.p95TPOT" suffix="ms" />
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="6">
        <el-card shadow="hover" class="metric-card">
          <el-statistic title="Latency P95" :value="metrics.p95Latency" suffix="ms" />
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="6">
        <el-card shadow="hover" class="metric-card">
          <el-statistic title="OTPS P95" :value="metrics.p95OTPS" suffix="tokens/s" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 性能指标趋势图 -->
    <el-card class="mt-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="font-bold m-0">性能指标趋势</h3>
        </div>
      </template>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="TTFT (首字延迟)" name="ttft">
          <div ref="ttftChartRef" style="width: 100%; height: 450px" />
        </el-tab-pane>
        <el-tab-pane label="OTPS (输出吞吐)" name="otps">
          <div ref="otpsChartRef" style="width: 100%; height: 450px" />
        </el-tab-pane>
        <el-tab-pane label="TPOT (单Token耗时)" name="tpot">
          <div ref="tpotChartRef" style="width: 100%; height: 450px" />
        </el-tab-pane>
        <el-tab-pane label="端到端延迟" name="latency">
          <div ref="latencyChartRef" style="width: 100%; height: 450px" />
        </el-tab-pane>
        <el-tab-pane label="TPM (每分钟Token)" name="tpm">
          <div ref="tpmChartRef" style="width: 100%; height: 450px" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 筛选条件
const filters = reactive({
  organization: '',
  model: '',
  dateRange: [new Date(new Date().getTime() - 24 * 60 * 60 * 1000), new Date()],
  granularity: 'hour',
})

// 核心指标数据
const metrics = ref({
  totalCalls: 125890,
  failedCalls: 124,
  failureRate: 0.1,
  totalTokens: 45892100,
  inputTokens: 12450000,
  outputTokens: 33442100,
  p95TTFT: 245,
  p95TPOT: 32,
  p95Latency: 1850,
  p95OTPS: 35,
})

// 图表相关
const activeTab = ref('ttft')
const ttftChartRef = ref<HTMLElement | null>(null)
const otpsChartRef = ref<HTMLElement | null>(null)
const tpotChartRef = ref<HTMLElement | null>(null)
const latencyChartRef = ref<HTMLElement | null>(null)
const tpmChartRef = ref<HTMLElement | null>(null)

let ttftChart: echarts.ECharts | null = null
let otpsChart: echarts.ECharts | null = null
let tpotChart: echarts.ECharts | null = null
let latencyChart: echarts.ECharts | null = null
let tpmChart: echarts.ECharts | null = null

// 模拟生成时间轴数据
const generateTimeData = (count: number) => {
  const data = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60 * 60 * 1000)
    data.push(
      `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
    )
  }
  return data
}

// 模拟生成数值数据
const generateValueData = (count: number, base: number, variance: number) => {
  const data = []
  for (let i = 0; i < count; i++) {
    data.push(Math.floor(base + Math.random() * variance - variance / 2))
  }
  return data
}

// 通用图表配置生成器
const getChartOption = (
  title: string,
  unit: string,
  xAxisData: string[],
  seriesDataMap: Record<string, number[]>,
) => {
  const series = Object.keys(seriesDataMap).map((key) => ({
    name: key,
    type: 'line',
    smooth: true,
    symbol: 'none',
    data: seriesDataMap[key],
    emphasis: { focus: 'series' },
  }))

  return {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    legend: { data: Object.keys(seriesDataMap), bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '5%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
    yAxis: { type: 'value', name: unit },
    series,
  }
}

const initCharts = () => {
  const timeData = generateTimeData(24)

  // TTFT Chart
  if (ttftChartRef.value && !ttftChart) {
    ttftChart = echarts.init(ttftChartRef.value)
    ttftChart.setOption(
      getChartOption('TTFT趋势', 'ms', timeData, {
        Avg: generateValueData(24, 150, 50),
        P50: generateValueData(24, 140, 40),
        P90: generateValueData(24, 200, 60),
        P95: generateValueData(24, 250, 80),
        P99: generateValueData(24, 350, 100),
      }),
    )
  }

  // OTPS Chart
  if (otpsChartRef.value && !otpsChart) {
    otpsChart = echarts.init(otpsChartRef.value)
    otpsChart.setOption(
      getChartOption('OTPS趋势', 'tokens/s', timeData, {
        Avg: generateValueData(24, 45, 10),
        P50: generateValueData(24, 48, 8),
        P90: generateValueData(24, 35, 10),
        P95: generateValueData(24, 30, 10),
        P99: generateValueData(24, 20, 10),
      }),
    )
  }

  // TPOT Chart
  if (tpotChartRef.value && !tpotChart) {
    tpotChart = echarts.init(tpotChartRef.value)
    tpotChart.setOption(
      getChartOption('TPOT趋势', 'ms/token', timeData, {
        Avg: generateValueData(24, 25, 5),
        P50: generateValueData(24, 22, 4),
        P90: generateValueData(24, 30, 6),
        P95: generateValueData(24, 35, 8),
        P99: generateValueData(24, 45, 10),
      }),
    )
  }

  // Latency Chart
  if (latencyChartRef.value && !latencyChart) {
    latencyChart = echarts.init(latencyChartRef.value)
    latencyChart.setOption(
      getChartOption('端到端延迟', 'ms', timeData, {
        Avg: generateValueData(24, 1200, 300),
        P50: generateValueData(24, 1000, 200),
        P90: generateValueData(24, 1800, 400),
        P95: generateValueData(24, 2200, 500),
        P99: generateValueData(24, 3000, 800),
      }),
    )
  }

  // TPM Chart
  if (tpmChartRef.value && !tpmChart) {
    tpmChart = echarts.init(tpmChartRef.value)
    tpmChart.setOption(
      getChartOption('TPM趋势', 'tokens', timeData, {
        Total: generateValueData(24, 50000, 10000),
        Input: generateValueData(24, 15000, 5000),
        Output: generateValueData(24, 35000, 8000),
      }),
    )
  }
}

const handleTabChange = () => {
  nextTick(() => {
    resizeCharts()
  })
}

const resizeCharts = () => {
  ttftChart?.resize()
  otpsChart?.resize()
  tpotChart?.resize()
  latencyChart?.resize()
  tpmChart?.resize()
}

const handleSearch = () => {
  ElMessage.success('查询成功，数据已更新')
  // In a real app, this would fetch new data based on filters
  // For now, we just re-randomize the charts to simulate update
  ttftChart?.dispose()
  otpsChart?.dispose()
  tpotChart?.dispose()
  latencyChart?.dispose()
  tpmChart?.dispose()

  ttftChart = null
  otpsChart = null
  tpotChart = null
  latencyChart = null
  tpmChart = null

  initCharts()
}

// 监听容器大小变化，自动重绘图表
useResizeObserver([ttftChartRef, otpsChartRef, tpotChartRef, latencyChartRef, tpmChartRef], () => {
  resizeCharts()
})

onMounted(() => {
  nextTick(() => {
    initCharts()
  })
})

onUnmounted(() => {
  ttftChart?.dispose()
  otpsChart?.dispose()
  tpotChart?.dispose()
  latencyChart?.dispose()
  tpmChart?.dispose()
})
</script>

<style scoped lang="scss">
.performance-monitoring-page {
  padding: 20px;
}
.metric-card {
  margin-bottom: 10px;
}
</style>
