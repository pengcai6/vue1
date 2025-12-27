<template>
  <div class="create-evaluation-task-page p-5">
    <el-card>
      <h2 class="text-2xl font-bold mb-4">创建测评任务</h2>

      <el-form :model="form" label-width="150px">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.taskName" placeholder="请输入任务名称" style="width: 100%" />
        </el-form-item>

        <el-form-item label="任务描述">
          <el-input v-model="form.description" type="textarea" :rows="3" style="width: 100%" />
        </el-form-item>

        <el-form-item label="测评模型" required>
          <el-select v-model="form.models" multiple placeholder="选择测评模型" style="width: 100%">
            <el-option label="Llama-2-7B" value="llama-2-7b" />
            <el-option label="ChatGLM-6B" value="chatglm-6b" />
            <el-option label="Qwen-7B" value="qwen-7b" />
          </el-select>
        </el-form-item>

        <el-form-item label="测评数据集" required>
          <el-select
            v-model="form.datasets"
            multiple
            placeholder="选择测评数据集"
            style="width: 100%"
          >
            <el-option label="MMLU" value="mmlu" />
            <el-option label="C-Eval" value="c-eval" />
            <el-option label="GSM8K" value="gsm8k" />
            <el-option label="HumanEval" value="humaneval" />
            <el-option label="CMMLU" value="cmmlu" />
          </el-select>
        </el-form-item>

        <el-form-item label="测评指标">
          <el-checkbox-group v-model="form.metrics">
            <el-checkbox value="accuracy">准确率</el-checkbox>
            <el-checkbox value="f1">F1分数</el-checkbox>
            <el-checkbox value="bleu">BLEU</el-checkbox>
            <el-checkbox value="rouge">ROUGE</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="createTask">创建任务</el-button>
          <el-button @click="$router.back()">取消</el-button>
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
  models: [] as string[],
  datasets: [] as string[],
  metrics: ['accuracy'] as string[],
})

function createTask() {
  if (!form.value.taskName || form.value.models.length === 0 || form.value.datasets.length === 0) {
    ElMessage.warning('请填写必填项')
    return
  }

  const stored = localStorage.getItem('evaluation-tasks')
  const tasks = stored ? JSON.parse(stored) : []
  const newTask = {
    id: Date.now().toString(),
    ...form.value,
    status: 'pending',
    progress: 0,
    createTime: new Date().toLocaleString(),
  }

  tasks.unshift(newTask)
  localStorage.setItem('evaluation-tasks', JSON.stringify(tasks))

  ElMessage.success('测评任务创建成功')
  router.push('/model-evaluation/task-list')
}
</script>
