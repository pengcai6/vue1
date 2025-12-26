<template>
  <div class="create-version-page">
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
            <el-icon class="el-icon--upload"><i-ep-upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createVersion">创建版本</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStorage } from '~/utils/storage'

const router = useRouter()
const dataset = ref<any>(null)
const form = ref({
  version: '',
  description: '',
})

function createVersion() {
  ElMessage.success('数据集版本创建成功')
  setTimeout(() => {
    router.back()
  }, 1000)
}

onMounted(() => {
  dataset.value = getStorage('current-dataset', null)
})
</script>

<style scoped lang="scss">
.create-version-page {
  padding: 20px;
}
</style>
