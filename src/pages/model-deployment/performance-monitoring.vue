<template>
  <div class="performance-monitoring-page">
    <el-page-header @back="$router.back()">
      <template #content>
        <span class="text-2xl font-bold">性能监控</span>
      </template>
    </el-page-header>

    <el-card class="mt-4">
      <el-form :inline="true">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" class="mt-4">
      <el-col :span="8">
        <el-card>
          <el-statistic title="总调用量" :value="metrics.totalCalls" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <el-statistic title="平均TTFT" :value="metrics.avgTTFT" suffix="ms" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <el-statistic title="平均TPS" :value="metrics.avgTPS" suffix="tokens/s" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mt-4">
      <h3 class="font-bold mb-4">性能指标趋势</h3>
      <el-tabs>
        <el-tab-pane label="TTFT">
          <el-empty description="TTFT时间趋势图（可接入ECharts）" />
        </el-tab-pane>
        <el-tab-pane label="TPOT">
          <el-empty description="TPOT时间趋势图" />
        </el-tab-pane>
        <el-tab-pane label="E2E Latency">
          <el-empty description="端到端延迟趋势图" />
        </el-tab-pane>
        <el-tab-pane label="TPM">
          <el-empty description="每分钟Token数趋势图" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const dateRange = ref<[Date, Date]>([new Date(), new Date()])
const metrics = ref({
  totalCalls: 15234,
  avgTTFT: 156,
  avgTPS: 45,
})
</script>

<style scoped lang="scss">
.performance-monitoring-page {
  padding: 20px;
}
</style>
