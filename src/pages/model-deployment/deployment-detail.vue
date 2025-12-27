<template>
  <div class="deployment-detail-page p-5">
    <el-page-header @back="$router.back()">
      <template #content>
        <span class="text-2xl font-bold">{{ service?.serviceName }}</span>
      </template>
    </el-page-header>

    <el-card v-if="service" class="mt-4">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="服务名称">
          {{ service.serviceName }}
        </el-descriptions-item>
        <el-descriptions-item label="服务状态">
          <el-tag :type="service.status === 'running' ? 'success' : 'info'">
            {{ service.status === 'running' ? '运行中' : '已停止' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="模型名称">
          {{ service.modelName }}
        </el-descriptions-item>
        <el-descriptions-item label="副本数">
          {{ service.replicas }}
        </el-descriptions-item>
        <el-descriptions-item label="集群">
          {{ service.cluster }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ service.createTime }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const service = ref<any>(null)

onMounted(() => {
  const stored = localStorage.getItem('current-service')
  service.value = stored ? JSON.parse(stored) : null
})
</script>
