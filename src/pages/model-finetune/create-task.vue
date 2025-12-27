<template>
  <div class="create-task-page p-5">
    <el-card>
      <h2 class="text-2xl font-bold mb-4">创建微调任务 (LoRA)</h2>

      <el-form :model="form" label-width="150px">
        <el-divider content-position="left"> 基础信息 </el-divider>

        <el-form-item label="任务名称" required>
          <el-input v-model="form.taskName" placeholder="请输入任务名称" style="width: 100%" />
        </el-form-item>

        <el-form-item label="任务描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
            style="width: 100%"
          />
        </el-form-item>

        <el-divider content-position="left"> 模型配置 </el-divider>

        <el-form-item label="基座模型" required>
          <el-select v-model="form.baseModel" placeholder="选择基座模型" style="width: 100%">
            <el-option label="Llama-2-7B" value="llama-2-7b" />
            <el-option label="ChatGLM-6B" value="chatglm-6b" />
            <el-option label="Qwen-7B" value="qwen-7b" />
            <el-option label="Baichuan-13B" value="baichuan-13b" />
          </el-select>
        </el-form-item>

        <el-form-item label="微调数据集" required>
          <el-select v-model="form.dataset" placeholder="选择数据集" style="width: 100%">
            <el-option label="自定义对话数据集-v1" value="custom-chat-v1" />
            <el-option label="指令微调数据集" value="instruction-dataset" />
            <el-option label="金融领域数据集" value="finance-dataset" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left"> 微调参数 </el-divider>

        <el-form-item label="Learning Rate">
          <el-input-number
            v-model="form.learningRate"
            :min="0.00001"
            :max="0.01"
            :step="0.00001"
            :precision="5"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Number of Epochs">
          <el-input-number v-model="form.epochs" :min="1" :max="20" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Batch Size">
          <el-input-number v-model="form.batchSize" :min="1" :max="128" style="width: 100%" />
        </el-form-item>

        <el-form-item label="LoRA Rank">
          <el-input-number v-model="form.loraRank" :min="1" :max="256" style="width: 100%" />
        </el-form-item>

        <el-form-item label="LoRA Alpha">
          <el-input-number v-model="form.loraAlpha" :min="1" :max="512" style="width: 100%" />
        </el-form-item>

        <el-form-item label="LoRA Dropout">
          <el-input-number
            v-model="form.loraDropout"
            :min="0"
            :max="1"
            :step="0.1"
            :precision="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Max Tokens">
          <el-input-number
            v-model="form.maxTokens"
            :min="512"
            :max="4096"
            :step="512"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="createTask"> 创建任务 </el-button>
          <el-button @click="goBack"> 取消 </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const form = ref({
  taskName: '',
  description: '',
  baseModel: '',
  dataset: '',
  learningRate: 0.0001,
  epochs: 3,
  batchSize: 8,
  loraRank: 8,
  loraAlpha: 16,
  loraDropout: 0.1,
  maxTokens: 2048,
})

function createTask() {
  if (!form.value.taskName || !form.value.baseModel || !form.value.dataset) {
    ElMessage.warning('请填写必填项')
    return
  }

  const stored = localStorage.getItem('finetune-tasks')
  const tasks = stored ? JSON.parse(stored) : []
  const newTask = {
    id: Date.now().toString(),
    ...form.value,
    status: 'pending',
    progress: 0,
    createTime: new Date().toLocaleString(),
  }

  tasks.unshift(newTask)
  localStorage.setItem('finetune-tasks', JSON.stringify(tasks))

  ElMessage.success('微调任务创建成功')
  router.push('/model-finetune/task-list')
}

function goBack() {
  router.back()
}
</script>
