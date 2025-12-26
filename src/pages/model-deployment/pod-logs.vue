<template>
  <div class="pod-logs-page">
    <el-page-header @back="$router.back()">
      <template #content>
        <span class="text-2xl font-bold">容器组（Pod）与日志</span>
      </template>
    </el-page-header>

    <el-card class="mt-4">
      <el-table :data="pods" stripe>
        <el-table-column prop="podName" label="容器组名称" width="250" />
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'Running' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cluster" label="集群" width="150" />
        <el-table-column prop="node" label="所在节点" width="180" />
        <el-table-column prop="gpuCards" label="所占GPU卡" width="150" />
        <el-table-column prop="restarts" label="重启次数" width="100" align="center" />
        <el-table-column prop="podIP" label="容器组IP" width="150" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewLogs(row)">
              查看日志
            </el-button>
            <el-button link @click="viewEvents(row)">
              查看事件
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showLogsDialog" title="容器日志" width="80%">
      <div class="log-viewer">
        <div v-for="(log, index) in logs" :key="index" class="log-line">
          {{ log }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const pods = ref([
  {
    podName: 'llama2-chat-service-7b8f9d-0',
    status: 'Running',
    cluster: 'gpu-cluster-01',
    node: 'gpu-node-01',
    gpuCards: 'GPU-0,GPU-1',
    restarts: 0,
    podIP: '10.244.1.5',
  },
  {
    podName: 'llama2-chat-service-7b8f9d-1',
    status: 'Running',
    cluster: 'gpu-cluster-01',
    node: 'gpu-node-02',
    gpuCards: 'GPU-0,GPU-1',
    restarts: 0,
    podIP: '10.244.2.8',
  },
])

const showLogsDialog = ref(false)
const logs = ref([
  '[2024-01-15 14:30:00] INFO: Starting model service...',
  '[2024-01-15 14:30:05] INFO: Loading model weights...',
  '[2024-01-15 14:30:20] INFO: Model loaded successfully',
  '[2024-01-15 14:30:25] INFO: Server listening on port 8000',
])

function viewLogs(pod: any) {
  showLogsDialog.value = true
}

function viewEvents(pod: any) {
  console.log('View events for:', pod)
}
</script>

<style scoped lang="scss">
.pod-logs-page {
  padding: 20px;

  .log-viewer {
    background: #000;
    color: #0f0;
    padding: 15px;
    font-family: monospace;
    max-height: 500px;
    overflow-y: auto;

    .log-line {
      margin-bottom: 3px;
    }
  }
}
</style>
