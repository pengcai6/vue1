<template>
  <div class="performance-testing-page">
    <el-page-header @back="$router.back()">
      <template #content>
        <span class="text-2xl font-bold">性能测试与报告</span>
      </template>
    </el-page-header>

    <el-card class="mt-4">
      <h3 class="font-bold mb-4">启动性能测试</h3>
      <el-form :model="testForm" label-width="150px">
        <el-form-item label="测试并发数">
          <el-input-number v-model="testForm.concurrency" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="测试请求数">
          <el-input-number v-model="testForm.requests" :min="10" :max="10000" />
        </el-form-item>
        <el-form-item label="测试提示词">
          <el-input v-model="testForm.prompt" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="testing" @click="startTest"> 开始测试 </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="testResult" class="mt-4">
      <h3 class="font-bold mb-4">测试报告</h3>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="总请求数">{{ testResult.totalRequests }}</el-descriptions-item>
        <el-descriptions-item label="成功数">{{ testResult.successCount }}</el-descriptions-item>
        <el-descriptions-item label="失败数">{{ testResult.failureCount }}</el-descriptions-item>
        <el-descriptions-item label="平均TTFT">{{ testResult.avgTTFT }} ms</el-descriptions-item>
        <el-descriptions-item label="P95 TTFT">{{ testResult.p95TTFT }} ms</el-descriptions-item>
        <el-descriptions-item label="P99 TTFT">{{ testResult.p99TTFT }} ms</el-descriptions-item>
        <el-descriptions-item label="平均TPS"
          >{{ testResult.avgTPS }} tokens/s</el-descriptions-item
        >
        <el-descriptions-item label="吞吐量"
          >{{ testResult.throughput }} req/s</el-descriptions-item
        >
        <el-descriptions-item label="总耗时">{{ testResult.totalTime }} s</el-descriptions-item>
      </el-descriptions>

      <div class="mt-6">
        <h4 class="font-bold mb-4">响应时间分布</h4>
        <div ref="chartRef" style="width: 100%; height: 400px" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const testing = ref(false)
const testForm = ref({
  concurrency: 10,
  requests: 100,
  prompt: '介绍一下人工智能',
})

const testResult = ref<any>(null)
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

async function startTest() {
  testing.value = true
  testResult.value = null // Clear previous result
  await new Promise((resolve) => setTimeout(resolve, 3000))

  testResult.value = {
    totalRequests: testForm.value.requests,
    successCount: testForm.value.requests - 2,
    failureCount: 2,
    avgTTFT: 145,
    p95TTFT: 230,
    p99TTFT: 280,
    avgTPS: 48,
    throughput: 25.5,
    totalTime: 3.9,
  }

  testing.value = false
  ElMessage.success('性能测试完成')

  nextTick(() => {
    initChart()
  })
}

function initChart() {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  // Generate some mock distribution data
  const data = []
  const count = 50
  for (let i = 0; i < count; i++) {
    data.push(Math.floor(Math.random() * 200) + 100) // Random latency between 100-300ms
  }
  data.sort((a, b) => a - b)

  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((_, index) => `Req ${index + 1}`),
    },
    yAxis: { type: 'value', name: 'Latency (ms)' },
    series: [
      {
        name: 'Latency',
        data: data,
        type: 'bar',
        itemStyle: { color: '#409eff' },
      },
    ],
  })
}

const handleResize = () => {
  chartInstance?.resize()
}

window.addEventListener('resize', handleResize)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped lang="scss">
.performance-testing-page {
  padding: 20px;
}
</style>
