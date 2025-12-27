<template>
  <div class="dashboard-page p-6">
    <el-card class="mb-4">
      <h1 class="text-3xl font-bold mb-2">大模型服务平台</h1>
      <p class="text-gray-500">欢迎使用大模型服务平台，一站式模型开发、部署、监控解决方案</p>
    </el-card>

    <el-row :gutter="20" class="mb-4">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon text-blue-500">
              <el-icon :size="40">
                <cpu />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">128</div>
              <div class="stat-label">模型总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon text-green-500">
              <el-icon :size="40">
                <check />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">45</div>
              <div class="stat-label">运行中服务</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon text-orange-500">
              <el-icon :size="40">
                <tools />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">12</div>
              <div class="stat-label">微调任务</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon text-purple-500">
              <el-icon :size="40">
                <document />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">256</div>
              <div class="stat-label">数据集</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="font-bold">快速入口</span>
            </div>
          </template>
          <div class="quick-links">
            <el-button
              type="primary"
              class="w-full mb-3"
              @click="navigateTo('/model-marketplace/model-list')"
            >
              模型广场
            </el-button>
            <el-button
              type="success"
              class="w-full mb-3"
              @click="navigateTo('/model-deployment/one-click-deploy')"
            >
              一键部署
            </el-button>
            <el-button
              type="warning"
              class="w-full mb-3"
              @click="navigateTo('/model-finetune/task-list')"
            >
              模型微调
            </el-button>
            <el-button
              type="info"
              class="w-full"
              @click="navigateTo('/model-evaluation/task-list')"
            >
              模型评测
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="font-bold">最近活动</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item timestamp="2024-01-15 10:30" placement="top">
              <el-card>
                <p>部署了模型服务: Llama-2-7B</p>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-14 16:20" placement="top">
              <el-card>
                <p>完成微调任务: ChatGLM-6B-Finance</p>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-13 09:15" placement="top">
              <el-card>
                <p>创建数据集: 客服对话数据集</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Cpu, Check, Tools, Document } from '@element-plus/icons-vue'

const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
.dashboard-page {
  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;

    .stat-icon {
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 2rem;
        font-weight: bold;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--el-text-color-secondary);
        margin-top: 0.25rem;
      }
    }
  }

  .quick-links {
    .el-button {
      justify-content: flex-start;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
