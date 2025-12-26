<template>
  <div class="dataset-list-page">
    <el-card class="header-card">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">数据集管理</h2>
        <el-button type="primary" @click="showCreateDialog = true">
          创建数据集
        </el-button>
      </div>
    </el-card>

    <el-card class="mt-4">
      <el-table :data="datasets" stripe>
        <el-table-column prop="name" label="数据集名称" width="200" />
        <el-table-column prop="id" label="ID" width="150" />
        <el-table-column prop="format" label="数据格式" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.format }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="latestVersion" label="最新版本" width="120" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ready' ? 'success' : 'warning'">
              {{ row.status === 'ready' ? '就绪' : '处理中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataCount" label="数据量" width="120" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">
              详情
            </el-button>
            <el-button link @click="createVersion(row)">
              新建版本
            </el-button>
            <el-popconfirm title="确定删除?" @confirm="deleteDataset(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="创建数据集" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="数据集名称">
          <el-input v-model="form.name" placeholder="请输入数据集名称" />
        </el-form-item>
        <el-form-item label="数据集描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="数据用途">
          <el-select v-model="form.purpose" placeholder="选择数据用途">
            <el-option label="微调" value="finetune" />
            <el-option label="测评" value="evaluation" />
            <el-option label="预训练" value="pretrain" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据格式">
          <el-select v-model="form.format" placeholder="选择数据格式">
            <el-option label="JSON" value="json" />
            <el-option label="JSONL" value="jsonl" />
            <el-option label="CSV" value="csv" />
            <el-option label="TXT" value="txt" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload drag action="#" :auto-upload="false">
            <el-icon class="el-icon--upload"><i-ep-upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createDataset">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStorage, setStorage } from '~/utils/storage'

const router = useRouter()
const datasets = ref<any[]>([])
const showCreateDialog = ref(false)
const form = ref({
  name: '',
  description: '',
  purpose: '',
  format: '',
})

function initMockData() {
  return [
    {
      id: 'ds-001',
      name: '客服对话数据集',
      format: 'jsonl',
      latestVersion: 'v1.2',
      status: 'ready',
      dataCount: 10000,
      createTime: '2024-01-10 10:00:00',
    },
    {
      id: 'ds-002',
      name: '金融问答数据集',
      format: 'json',
      latestVersion: 'v1.0',
      status: 'ready',
      dataCount: 5000,
      createTime: '2024-01-12 14:30:00',
    },
  ]
}

function viewDetail(dataset: any) {
  setStorage('current-dataset', dataset)
  router.push('/dataset-management/dataset-detail')
}

function createVersion(dataset: any) {
  setStorage('current-dataset', dataset)
  router.push('/dataset-management/create-version')
}

function createDataset() {
  const newDataset = {
    id: `ds-${Date.now()}`,
    name: form.value.name,
    format: form.value.format,
    latestVersion: 'v1.0',
    status: 'ready',
    dataCount: 0,
    createTime: new Date().toLocaleString(),
  }
  
  datasets.value.unshift(newDataset)
  setStorage('datasets', datasets.value)
  showCreateDialog.value = false
  ElMessage.success('数据集创建成功')
}

function deleteDataset(id: string) {
  datasets.value = datasets.value.filter(d => d.id !== id)
  setStorage('datasets', datasets.value)
  ElMessage.success('删除成功')
}

onMounted(() => {
  const stored = getStorage('datasets', [])
  datasets.value = stored.length > 0 ? stored : initMockData()
})
</script>

<style scoped lang="scss">
.dataset-list-page {
  padding: 20px;
}
</style>
