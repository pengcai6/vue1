<template>
  <div class="evaluation-results-page">
    <el-page-header @back="$router.back()">
      <template #content>
        <span class="text-2xl font-bold">测评结果</span>
      </template>
    </el-page-header>

    <el-card class="mt-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold">测评结果总览</h3>
        <el-button type="primary" @click="downloadResults">
          下载结果
        </el-button>
      </div>

      <el-table :data="overviewData" border>
        <el-table-column prop="dataset" label="数据集" width="150" />
        <el-table-column label="Llama-2-7B" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.llama2 }}%</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="ChatGLM-6B" align="center">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.chatglm }}%</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Qwen-7B" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.qwen }}%</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="mt-4">
      <h3 class="font-bold mb-4">数据集明细</h3>
      <el-table :data="detailData" border>
        <el-table-column prop="dataset" label="数据集" width="150" />
        <el-table-column prop="subset" label="子集" width="200" />
        <el-table-column prop="metric" label="评估指标" width="120" />
        <el-table-column prop="model" label="模型" width="150" />
        <el-table-column label="得分" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.score" :color="getScoreColor(row.score)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const overviewData = ref([
  { dataset: 'MMLU', llama2: 85.2, chatglm: 78.5, qwen: 82.3 },
  { dataset: 'C-Eval', llama2: 78.5, chatglm: 82.1, qwen: 85.6 },
  { dataset: 'GSM8K', llama2: 72.3, chatglm: 68.9, qwen: 75.2 },
  { dataset: 'HumanEval', llama2: 65.8, chatglm: 62.3, qwen: 68.5 },
])

const detailData = ref([
  { dataset: 'MMLU', subset: 'STEM', metric: 'Accuracy', model: 'Llama-2-7B', score: 88 },
  { dataset: 'MMLU', subset: 'Humanities', metric: 'Accuracy', model: 'Llama-2-7B', score: 82 },
  { dataset: 'C-Eval', subset: '理工科', metric: 'Accuracy', model: 'ChatGLM-6B', score: 85 },
  { dataset: 'C-Eval', subset: '人文社科', metric: 'Accuracy', model: 'ChatGLM-6B', score: 79 },
])

function getScoreColor(score: number) {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

function downloadResults() {
  ElMessage.success('结果下载中...')
}
</script>

<style scoped lang="scss">
.evaluation-results-page {
  padding: 20px;
}
</style>
