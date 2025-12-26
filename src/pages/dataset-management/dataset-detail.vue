<template>
  <div class="dataset-detail-page">
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
            <el-button link type="primary">下载</el-button>
            <el-popconfirm title="确定删除?" @confirm="deleteVersion(row.version)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
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
import { getStorage } from '~/utils/storage'

const dataset = ref<any>(null)
const versions = ref([
  { version: 'v1.2', description: '增加500条新数据', status: 'ready', dataCount: 10500, createTime: '2024-01-15 10:00:00' },
  { version: 'v1.1', description: '修复数据格式问题', status: 'ready', dataCount: 10000, createTime: '2024-01-12 14:00:00' },
  { version: 'v1.0', description: '初始版本', status: 'ready', dataCount: 10000, createTime: '2024-01-10 10:00:00' },
])

function deleteVersion(version: string) {
  ElMessage.success(`版本 ${version} 已删除`)
}

onMounted(() => {
  dataset.value = getStorage('current-dataset', null)
})
</script>

<style scoped lang="scss">
.dataset-detail-page {
  padding: 20px;
}
</style>
