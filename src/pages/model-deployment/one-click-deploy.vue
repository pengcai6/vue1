<template>
  <div class="one-click-deploy-page p-5">
    <el-card>
      <h2 class="text-2xl font-bold mb-4">一键部署模型</h2>

      <el-steps :active="currentStep" finish-status="success" class="mb-6">
        <el-step title="选择模型" />
        <el-step title="配置部署" />
        <el-step title="确认部署" />
      </el-steps>

      <!-- 步骤1: 选择模型 -->
      <div v-if="currentStep === 0">
        <el-form :model="form" label-width="150px">
          <el-form-item label="选择模型">
            <el-select
              v-model="form.modelName"
              placeholder="请选择要部署的模型"
              style="width: 100%"
            >
              <el-option label="Llama-2-7B" value="llama-2-7b" />
              <el-option label="ChatGLM-6B" value="chatglm-6b" />
              <el-option label="Qwen-7B" value="qwen-7b" />
              <el-option label="Stable-Diffusion-XL" value="sd-xl" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2: 配置部署 -->
      <div v-if="currentStep === 1">
        <el-form :model="form" label-width="150px">
          <el-divider content-position="left"> 基础配置 </el-divider>

          <el-form-item label="服务名称">
            <el-input v-model="form.serviceName" placeholder="请输入服务名称" style="width: 100%" />
          </el-form-item>

          <el-form-item label="服务描述">
            <el-input v-model="form.description" type="textarea" :rows="2" style="width: 100%" />
          </el-form-item>

          <el-form-item label="服务能力">
            <el-checkbox-group v-model="form.capabilities">
              <el-checkbox value="chat"> 对话 </el-checkbox>
              <el-checkbox value="completion"> 文本补全 </el-checkbox>
              <el-checkbox value="embedding"> 向量化 </el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-divider content-position="left"> 资源配置 </el-divider>

          <el-form-item label="选择集群">
            <el-select v-model="form.cluster" placeholder="请选择集群" style="width: 100%">
              <el-option label="GPU集群-01" value="gpu-cluster-01" />
              <el-option label="GPU集群-02" value="gpu-cluster-02" />
            </el-select>
          </el-form-item>

          <el-form-item label="算力规格">
            <el-radio-group v-model="form.gpuSpec">
              <el-radio value="A100-1">NVIDIA A100 x 1</el-radio>
              <el-radio value="A100-2">NVIDIA A100 x 2</el-radio>
              <el-radio value="A100-4">NVIDIA A100 x 4</el-radio>
              <el-radio value="H100-1">NVIDIA H100 x 1</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="副本数">
            <el-input-number v-model="form.replicas" :min="1" :max="10" />
            <span class="ml-2 text-sm text-gray-500">系统将自动调度到最优节点</span>
          </el-form-item>

          <el-divider content-position="left"> 高级配置 </el-divider>

          <el-form-item label="环境变量">
            <el-input
              v-model="form.envVars"
              type="textarea"
              :rows="3"
              placeholder="KEY1=VALUE1&#10;KEY2=VALUE2"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="启动参数">
            <el-input
              v-model="form.startupArgs"
              type="textarea"
              :rows="2"
              placeholder="--max-batch-size=32"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤3: 确认部署 -->
      <div v-if="currentStep === 2">
        <el-alert type="success" :closable="false" class="mb-4">
          <template #title>
            <div class="font-bold">部署配置确认</div>
          </template>
        </el-alert>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="模型名称">
            {{ form.modelName }}
          </el-descriptions-item>
          <el-descriptions-item label="服务名称">
            {{ form.serviceName }}
          </el-descriptions-item>
          <el-descriptions-item label="集群">
            {{ form.cluster }}
          </el-descriptions-item>
          <el-descriptions-item label="算力规格">
            {{ form.gpuSpec }}
          </el-descriptions-item>
          <el-descriptions-item label="副本数">
            {{ form.replicas }}
          </el-descriptions-item>
          <el-descriptions-item label="服务能力">
            {{ form.capabilities.join(', ') }}
          </el-descriptions-item>
        </el-descriptions>

        <el-alert type="info" :closable="false" class="mt-4">
          系统将根据集群、算力规格及副本数，自动将模型服务调度到最优节点上进行部署
        </el-alert>
      </div>

      <!-- 操作按钮 -->
      <div class="mt-6 flex gap-3">
        <el-button v-if="currentStep > 0" @click="currentStep--"> 上一步 </el-button>
        <el-button v-if="currentStep < 2" type="primary" @click="currentStep++"> 下一步 </el-button>
        <el-button v-if="currentStep === 2" type="primary" :loading="deploying" @click="deploy">
          开始部署
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const currentStep = ref(0)
const deploying = ref(false)

const form = ref({
  modelName: '',
  serviceName: '',
  description: '',
  capabilities: ['chat'] as string[],
  cluster: '',
  gpuSpec: 'A100-1',
  replicas: 2,
  envVars: '',
  startupArgs: '',
})

async function deploy() {
  deploying.value = true

  // 模拟部署过程
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const stored = localStorage.getItem('deployment-services')
  const services = stored ? JSON.parse(stored) : []
  const newService = {
    id: Date.now().toString(),
    serviceName: form.value.serviceName,
    status: 'running',
    online: true,
    modelName: form.value.modelName,
    replicas: form.value.replicas,
    cluster: form.value.cluster,
    createTime: new Date().toLocaleString(),
  }

  services.unshift(newService)
  localStorage.setItem('deployment-services', JSON.stringify(services))

  deploying.value = false
  ElMessage.success('模型部署成功！')

  setTimeout(() => {
    router.push('/model-deployment/service-list')
  }, 1000)
}
</script>
