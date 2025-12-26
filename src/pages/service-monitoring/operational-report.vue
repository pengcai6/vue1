<template>
  <div class="operational-report-page">
    <!-- 时间范围选择 -->
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true">
        <el-form-item label="报告周期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 350px"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button-group>
            <el-button @click="handleQuickSelect('today')">今日</el-button>
            <el-button @click="handleQuickSelect('week')">本周</el-button>
            <el-button @click="handleQuickSelect('month')">本月</el-button>
            <el-button @click="handleQuickSelect('quarter')">本季度</el-button>
          </el-button-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleExportReport">
            <el-icon><Download /></el-icon>
            导出报告
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总调用次数" :value="metrics.totalCalls">
            <template #suffix>次</template>
          </el-statistic>
          <div class="metric-trend">
            <el-icon color="#67c23a"><CaretTop /></el-icon>
            <span style="color: #67c23a">+12.5%</span>
            <span style="color: #909399; margin-left: 4px">较上周期</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="活跃用户数" :value="metrics.activeUsers">
            <template #suffix>人</template>
          </el-statistic>
          <div class="metric-trend">
            <el-icon color="#67c23a"><CaretTop /></el-icon>
            <span style="color: #67c23a">+8.3%</span>
            <span style="color: #909399; margin-left: 4px">较上周期</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总Token消耗" :value="metrics.totalTokens">
            <template #suffix>M</template>
          </el-statistic>
          <div class="metric-trend">
            <el-icon color="#67c23a"><CaretTop /></el-icon>
            <span style="color: #67c23a">+18.7%</span>
            <span style="color: #909399; margin-left: 4px">较上周期</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="营收金额" :value="metrics.revenue" :precision="2">
            <template #prefix>¥</template>
          </el-statistic>
          <div class="metric-trend">
            <el-icon color="#67c23a"><CaretTop /></el-icon>
            <span style="color: #67c23a">+15.2%</span>
            <span style="color: #909399; margin-left: 4px">较上周期</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <!-- 调用趋势图表 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">API调用趋势</span>
            </div>
          </template>
          <div ref="callTrendChartRef" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>

      <!-- Token消耗趋势 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">Token消耗趋势</span>
            </div>
          </template>
          <div ref="tokenTrendChartRef" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <!-- 服务调用占比 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">服务调用占比</span>
            </div>
          </template>
          <div ref="serviceDistChartRef" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>

      <!-- 成本分析 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">成本分析</span>
            </div>
          </template>
          <div ref="costAnalysisChartRef" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 服务详细统计表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">服务详细统计</span>
        </div>
      </template>
      <el-table :data="serviceStats" border style="width: 100%">
        <el-table-column prop="serviceName" label="服务名称" width="200" />
        <el-table-column prop="calls" label="调用次数" width="120" align="right" sortable>
          <template #default="{ row }">
            {{ row.calls.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="successRate" label="成功率" width="100" align="center" sortable>
          <template #default="{ row }">
            <el-tag :type="row.successRate >= 99 ? 'success' : row.successRate >= 95 ? 'warning' : 'danger'">
              {{ row.successRate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgLatency" label="平均延迟(ms)" width="130" align="right" sortable />
        <el-table-column prop="inputTokens" label="输入Tokens" width="130" align="right" sortable>
          <template #default="{ row }">
            {{ (row.inputTokens / 1000000).toFixed(2) }}M
          </template>
        </el-table-column>
        <el-table-column prop="outputTokens" label="输出Tokens" width="130" align="right" sortable>
          <template #default="{ row }">
            {{ (row.outputTokens / 1000000).toFixed(2) }}M
          </template>
        </el-table-column>
        <el-table-column prop="totalTokens" label="总Tokens" width="130" align="right" sortable>
          <template #default="{ row }">
            {{ (row.totalTokens / 1000000).toFixed(2) }}M
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="成本(¥)" width="120" align="right" sortable>
          <template #default="{ row }">
            ¥{{ row.cost.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="revenue" label="营收(¥)" width="120" align="right" sortable>
          <template #default="{ row }">
            ¥{{ row.revenue.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="毛利率" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: getMarginColor(row.margin) }">{{ row.margin }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, CaretTop } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

interface ServiceStat {
  serviceName: string
  calls: number
  successRate: number
  avgLatency: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  revenue: number
  margin: number
}

// 日期范围
const dateRange = ref<[Date, Date]>([
  new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
  new Date(),
])

// 核心指标
const metrics = ref({
  totalCalls: 1245680,
  activeUsers: 3542,
  totalTokens: 8967.5,
  revenue: 456789.25,
})

// 服务统计
const serviceStats = ref<ServiceStat[]>([
  {
    serviceName: 'qwen-chat-api',
    calls: 523456,
    successRate: 99.2,
    avgLatency: 1234,
    inputTokens: 45670000,
    outputTokens: 123450000,
    totalTokens: 169120000,
    cost: 84560,
    revenue: 169120,
    margin: 50.0,
  },
  {
    serviceName: 'deepseek-inference',
    calls: 412389,
    successRate: 98.8,
    avgLatency: 2156,
    inputTokens: 38920000,
    outputTokens: 98760000,
    totalTokens: 137680000,
    cost: 68840,
    revenue: 137680,
    margin: 50.0,
  },
  {
    serviceName: 'glm-service',
    calls: 309835,
    successRate: 99.5,
    avgLatency: 1567,
    inputTokens: 29340000,
    outputTokens: 74560000,
    totalTokens: 103900000,
    cost: 51950,
    revenue: 103900,
    margin: 50.0,
  },
])

// 图表引用
const callTrendChartRef = ref()
const tokenTrendChartRef = ref()
const serviceDistChartRef = ref()
const costAnalysisChartRef = ref()

// 图表实例
let callTrendChart: echarts.ECharts | null = null
let tokenTrendChart: echarts.ECharts | null = null
let serviceDistChart: echarts.ECharts | null = null
let costAnalysisChart: echarts.ECharts | null = null

// 日期快速选择
const handleQuickSelect = (period: string) => {
  const now = new Date()
  let start: Date

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), quarter * 3, 1)
      break
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  dateRange.value = [start, now]
  handleDateChange()
}

// 日期变化
const handleDateChange = () => {
  ElMessage.success('数据已更新')
  initCharts()
}

// 导出报告
const handleExportReport = () => {
  ElMessage.success('运营报告导出功能（演示模式）- 已生成 Excel 文件')
}

// 初始化图表
const initCharts = async () => {
  await nextTick()

  // 调用趋势图表
  if (callTrendChartRef.value) {
    callTrendChart = echarts.init(callTrendChartRef.value)
    callTrendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'API调用次数',
          type: 'line',
          smooth: true,
          data: [165420, 178930, 192340, 188670, 201450, 215890, 223680],
          itemStyle: { color: '#409eff' },
          areaStyle: { color: 'rgba(64, 158, 255, 0.1)' },
        },
      ],
    })
  }

  // Token消耗趋势
  if (tokenTrendChartRef.value) {
    tokenTrendChart = echarts.init(tokenTrendChartRef.value)
    tokenTrendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['输入Tokens', '输出Tokens'], top: '0%' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      },
      yAxis: { type: 'value', name: '百万tokens' },
      series: [
        {
          name: '输入Tokens',
          type: 'bar',
          stack: 'tokens',
          data: [345, 367, 389, 378, 402, 425, 438],
          itemStyle: { color: '#67c23a' },
        },
        {
          name: '输出Tokens',
          type: 'bar',
          stack: 'tokens',
          data: [876, 923, 982, 956, 1015, 1078, 1109],
          itemStyle: { color: '#409eff' },
        },
      ],
    })
  }

  // 服务调用占比
  if (serviceDistChartRef.value) {
    serviceDistChart = echarts.init(serviceDistChartRef.value)
    serviceDistChart.setOption({
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '服务调用',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: true, formatter: '{b}: {d}%' },
          data: [
            { value: 523456, name: 'qwen-chat-api', itemStyle: { color: '#409eff' } },
            { value: 412389, name: 'deepseek-inference', itemStyle: { color: '#67c23a' } },
            { value: 309835, name: 'glm-service', itemStyle: { color: '#e6a23c' } },
          ],
        },
      ],
    })
  }

  // 成本分析
  if (costAnalysisChartRef.value) {
    costAnalysisChart = echarts.init(costAnalysisChartRef.value)
    costAnalysisChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['成本', '营收'], top: '0%' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['qwen-chat-api', 'deepseek-inference', 'glm-service'],
      },
      yAxis: { type: 'value', name: '金额(¥)' },
      series: [
        {
          name: '成本',
          type: 'bar',
          data: [84560, 68840, 51950],
          itemStyle: { color: '#f56c6c' },
        },
        {
          name: '营收',
          type: 'bar',
          data: [169120, 137680, 103900],
          itemStyle: { color: '#67c23a' },
        },
      ],
    })
  }
}

// 获取毛利率颜色
const getMarginColor = (margin: number) => {
  if (margin >= 50) return '#67c23a'
  if (margin >= 30) return '#e6a23c'
  return '#f56c6c'
}

// 响应式调整
const handleResize = () => {
  callTrendChart?.resize()
  tokenTrendChart?.resize()
  serviceDistChart?.resize()
  costAnalysisChart?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

// 清理
const onUnmounted = () => {
  window.removeEventListener('resize', handleResize)
  callTrendChart?.dispose()
  tokenTrendChart?.dispose()
  serviceDistChart?.dispose()
  costAnalysisChart?.dispose()
}
</script>

<style scoped lang="scss">
.operational-report-page {
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

  .metric-trend {
    display: flex;
    align-items: center;
    margin-top: 8px;
    font-size: 13px;
  }
}
</style>
