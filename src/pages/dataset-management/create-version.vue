<template>
  <div class="create-version-page p-5">
    <el-card>
      <h2 class="text-2xl font-bold mb-4">新建数据集版本</h2>

      <el-form :model="form" label-width="120px">
        <el-form-item label="数据集名称">
          <el-input :value="dataset?.name" disabled />
        </el-form-item>
        <el-form-item label="当前版本">
          <el-input :value="dataset?.latestVersion" disabled />
        </el-form-item>
        <el-form-item label="新版本号">
          <el-input v-model="form.version" placeholder="例如: v1.3" />
        </el-form-item>
        <el-form-item label="版本描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload drag action="#" :auto-upload="false">
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createVersion"> 创建版本 </el-button>
          <el-button @click="$router.back()"> 取消 </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const router = useRouter()
const dataset = ref<any>(null)
const form = ref({
  version: '',
  description: '',
})

function createVersion() {
  if (!dataset.value) return

  // 1. 更新版本列表
  const versionKey = `dataset_versions_${dataset.value.id}`
  const storedVersions = localStorage.getItem(versionKey)
  let versions = storedVersions ? JSON.parse(storedVersions) : []

  // 如果是空且是演示数据，初始化模拟数据，保持与详情页一致
  if (versions.length === 0 && dataset.value.id === 'ds-001') {
    versions = [
      {
        version: 'v1.2',
        description: '增加500条新数据',
        status: 'ready',
        dataCount: 10500,
        createTime: '2024-01-15 10:00:00',
      },
      {
        version: 'v1.1',
        description: '修复数据格式问题',
        status: 'ready',
        dataCount: 10000,
        createTime: '2024-01-12 14:00:00',
      },
      {
        version: 'v1.0',
        description: '初始版本',
        status: 'ready',
        dataCount: 10000,
        createTime: '2024-01-10 10:00:00',
      },
    ]
  }

  const newVersion = {
    version: form.value.version,
    description: form.value.description,
    status: 'ready',
    dataCount: dataset.value.dataCount || 0,
    createTime: new Date().toLocaleString(),
  }

  versions.unshift(newVersion)
  localStorage.setItem(versionKey, JSON.stringify(versions))

  // 2. 更新数据集列表中的最新版本号
  const datasetsStored = localStorage.getItem('datasets')
  if (datasetsStored) {
    const datasets = JSON.parse(datasetsStored)
    const index = datasets.findIndex((d: any) => d.id === dataset.value.id)
    if (index !== -1) {
      datasets[index].latestVersion = form.value.version
      localStorage.setItem('datasets', JSON.stringify(datasets))
    }
  }

  ElMessage.success('数据集版本创建成功')
  setTimeout(() => {
    router.back()
  }, 1000)
}

onMounted(() => {
  const stored = localStorage.getItem('current-dataset')
  dataset.value = stored ? JSON.parse(stored) : null
})
</script>
