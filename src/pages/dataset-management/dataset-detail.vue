<template>
  <div class="dataset-detail-page p-5">
    <el-page-header @back="$router.back()">
      <template #content>
        <span class="text-2xl font-bold">{{ dataset?.name }}</span>
      </template>
    </el-page-header>

    <el-card v-if="dataset" class="mt-4">
      <h3 class="font-bold mb-4">数据集版本列表</h3>
      <el-table :data="versions" border>
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="description" label="版本描述" min-width="200" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ready' ? 'success' : 'warning'">
              {{ row.status === 'ready' ? '就绪' : '处理中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataCount" label="数据量" width="120" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="downloadVersion(row)"> 下载 </el-button>
            <el-popconfirm title="确定删除?" @confirm="deleteVersion(row.version)">
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
import { ElMessage } from 'element-plus'

const dataset = ref<any>(null)
const versions = ref<any[]>([])

function loadVersions() {
  if (!dataset.value) return
  const key = `dataset_versions_${dataset.value.id}`
  const stored = localStorage.getItem(key)
  if (stored) {
    versions.value = JSON.parse(stored)
  } else {
    versions.value = [
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
    saveVersions()
  }
}

function saveVersions() {
  if (!dataset.value) return
  const key = `dataset_versions_${dataset.value.id}`
  localStorage.setItem(key, JSON.stringify(versions.value))
}

function deleteVersion(version: string) {
  versions.value = versions.value.filter((v) => v.version !== version)
  saveVersions()
  ElMessage.success(`版本 ${version} 已删除`)
}

function downloadVersion(row: any) {
  const content = JSON.stringify(
    {
      version: row.version,
      dataset: dataset.value?.name,
      data: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        instruction: `示例指令 ${i + 1}`,
        input: `示例输入 ${i + 1}`,
        output: `示例输出 ${i + 1}`,
      })),
    },
    null,
    2,
  )

  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${dataset.value?.name}-${row.version}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('开始下载')
}

onMounted(() => {
  const stored = localStorage.getItem('current-dataset')
  dataset.value = stored ? JSON.parse(stored) : null
  loadVersions()
})
</script>
