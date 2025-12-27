<template>
  <div class="service-list-page p-5">
    <el-card class="header-card">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">模型服务列表</h2>
        <el-button type="primary" @click="deployNew"> 一键部署 </el-button>
      </div>
    </el-card>

    <el-card class="mt-4">
      <el-table :data="services" stripe style="width: 100%">
        <el-table-column prop="serviceName" label="服务名称" min-width="200" />
        <el-table-column label="服务状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'running' ? 'success' : 'info'">
              {{ row.status === 'running' ? '运行中' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上线状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'warning'">
              {{ row.online ? '已上线' : '未上线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="modelName" label="模型名称" min-width="180" />
        <el-table-column prop="replicas" label="副本数" width="100" align="center" />
        <el-table-column prop="cluster" label="集群" min-width="150" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="380" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)"> 详情 </el-button>
            <el-button link @click="viewPods(row)"> Pod列表 </el-button>
            <el-button link @click="viewMonitoring(row)"> 性能监控 </el-button>
            <el-button link @click="viewPerformanceTest(row)"> 性能测试 </el-button>
            <el-button
              v-if="row.status === 'running'"
              link
              type="warning"
              @click="stopService(row)"
            >
              停止
            </el-button>
            <el-popconfirm title="确定要删除此服务吗？" @confirm="deleteService(row.id)">
              <template #reference>
                <el-button link type="danger"> 删除 </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const services = ref<any[]>([])

function initMockData() {
  return [
    {
      id: '1',
      serviceName: 'llama2-chat-service',
      status: 'running',
      online: true,
      modelName: 'Llama-2-7B',
      replicas: 3,
      cluster: 'gpu-cluster-01',
      createTime: '2024-01-15 10:00:00',
    },
    {
      id: '2',
      serviceName: 'chatglm-service',
      status: 'running',
      online: true,
      modelName: 'ChatGLM-6B',
      replicas: 2,
      cluster: 'gpu-cluster-02',
      createTime: '2024-01-15 11:30:00',
    },
    {
      id: '3',
      serviceName: 'sd-image-service',
      status: 'stopped',
      online: false,
      modelName: 'Stable-Diffusion-XL',
      replicas: 1,
      cluster: 'gpu-cluster-01',
      createTime: '2024-01-14 15:00:00',
    },
  ]
}

function deployNew() {
  router.push('/model-deployment/one-click-deploy')
}

function viewDetail(service: any) {
  localStorage.setItem('current-service', JSON.stringify(service))
  router.push('/model-deployment/deployment-detail')
}

function viewPods(service: any) {
  localStorage.setItem('current-service', JSON.stringify(service))
  router.push('/model-deployment/pod-logs')
}

function viewMonitoring(service: any) {
  localStorage.setItem('current-service', JSON.stringify(service))
  router.push('/model-deployment/performance-monitoring')
}

function viewPerformanceTest(service: any) {
  localStorage.setItem('current-service', JSON.stringify(service))
  router.push('/model-deployment/performance-testing')
}

function stopService(service: any) {
  service.status = 'stopped'
  service.online = false
  saveToStorage()
  ElMessage.success('服务已停止')
}

function deleteService(id: string) {
  services.value = services.value.filter((s) => s.id !== id)
  saveToStorage()
  ElMessage.success('服务已删除')
}

function saveToStorage() {
  localStorage.setItem('deployment-services', JSON.stringify(services.value))
}

function loadFromStorage() {
  const stored = localStorage.getItem('deployment-services')
  services.value = stored ? JSON.parse(stored) : initMockData()
}

onMounted(() => {
  loadFromStorage()
})
</script>
