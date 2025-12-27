<template>
  <div class="resource-permission-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">资源权限管控</span>
          <el-button type="primary" @click="handleCreatePermission">
            <el-icon><Plus /></el-icon>
            添加权限规则
          </el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="资源类型">
          <el-select
            v-model="searchForm.resourceType"
            placeholder="请选择资源类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="模型" value="model" />
            <el-option label="数据集" value="dataset" />
            <el-option label="GPU资源" value="gpu" />
            <el-option label="部署服务" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="授权对象">
          <el-select
            v-model="searchForm.granteeType"
            placeholder="请选择授权对象"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="用户" value="user" />
            <el-option label="角色" value="role" />
            <el-option label="组织" value="organization" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限级别">
          <el-select
            v-model="searchForm.permission"
            placeholder="请选择权限级别"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="所有者" value="owner" />
            <el-option label="读写" value="read-write" />
            <el-option label="只读" value="read-only" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 权限规则列表 -->
      <el-table :data="paginatedPermissions" border style="width: 100%">
        <el-table-column prop="id" label="规则ID" width="140" />
        <el-table-column prop="resourceType" label="资源类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getResourceTypeTag(row.resourceType)">
              {{ getResourceTypeName(row.resourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resourceName" label="资源名称" width="200" show-overflow-tooltip />
        <el-table-column prop="granteeType" label="授权对象类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getGranteeTypeTag(row.granteeType)">
              {{ getGranteeTypeName(row.granteeType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="granteeName" label="授权对象" width="150" />
        <el-table-column prop="permission" label="权限级别" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getPermissionTag(row.permission)">
              {{ getPermissionName(row.permission) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredPermissions.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑权限规则对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '添加权限规则' : '编辑权限规则'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="资源类型" prop="resourceType">
          <el-select
            v-model="formData.resourceType"
            placeholder="请选择资源类型"
            @change="handleResourceTypeChange"
          >
            <el-option label="模型" value="model" />
            <el-option label="数据集" value="dataset" />
            <el-option label="GPU资源" value="gpu" />
            <el-option label="部署服务" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源" prop="resourceId">
          <el-select v-model="formData.resourceId" placeholder="请选择资源" filterable>
            <el-option
              v-for="resource in availableResources"
              :key="resource.id"
              :label="resource.name"
              :value="resource.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="授权对象类型" prop="granteeType">
          <el-select
            v-model="formData.granteeType"
            placeholder="请选择授权对象类型"
            @change="handleGranteeTypeChange"
          >
            <el-option label="用户" value="user" />
            <el-option label="角色" value="role" />
            <el-option label="组织" value="organization" />
          </el-select>
        </el-form-item>
        <el-form-item label="授权对象" prop="granteeId">
          <el-select v-model="formData.granteeId" placeholder="请选择授权对象" filterable>
            <el-option
              v-for="grantee in availableGrantees"
              :key="grantee.id"
              :label="grantee.name"
              :value="grantee.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权限级别" prop="permission">
          <el-radio-group v-model="formData.permission">
            <el-radio label="owner">所有者（读写删除）</el-radio>
            <el-radio label="read-write">读写</el-radio>
            <el-radio label="read-only">只读</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

interface Permission {
  id: string
  resourceType: 'model' | 'dataset' | 'gpu' | 'service'
  resourceId: string
  resourceName: string
  granteeType: 'user' | 'role' | 'organization'
  granteeId: string
  granteeName: string
  permission: 'owner' | 'read-write' | 'read-only'
  createdBy: string
  createdAt: string
}

interface Resource {
  id: string
  name: string
}

const STORAGE_KEY = 'resource_permissions_data'

// 搜索表单
const searchForm = ref({
  resourceType: '',
  granteeType: '',
  permission: '',
})

// 权限列表
const permissions = ref<Permission[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref()
const formData = ref({
  id: '',
  resourceType: '' as 'model' | 'dataset' | 'gpu' | 'service' | '',
  resourceId: '',
  granteeType: '' as 'user' | 'role' | 'organization' | '',
  granteeId: '',
  permission: 'read-only' as 'owner' | 'read-write' | 'read-only',
})

// 表单验证规则
const formRules = {
  resourceType: [{ required: true, message: '请选择资源类型', trigger: 'change' }],
  resourceId: [{ required: true, message: '请选择资源', trigger: 'change' }],
  granteeType: [{ required: true, message: '请选择授权对象类型', trigger: 'change' }],
  granteeId: [{ required: true, message: '请选择授权对象', trigger: 'change' }],
  permission: [{ required: true, message: '请选择权限级别', trigger: 'change' }],
}

// 可用资源列表
const availableResources = ref<Resource[]>([])
const availableGrantees = ref<Resource[]>([])

// 模拟资源数据
const mockResources: Record<string, Resource[]> = {
  model: [
    { id: 'model-001', name: 'Qwen2.5-72B-Instruct' },
    { id: 'model-002', name: 'DeepSeek-V3' },
    { id: 'model-003', name: 'GLM-4-Plus' },
  ],
  dataset: [
    { id: 'dataset-001', name: '客服对话数据集' },
    { id: 'dataset-002', name: '金融问答数据集' },
    { id: 'dataset-003', name: '医疗诊断数据集' },
  ],
  gpu: [
    { id: 'gpu-pool-001', name: 'NVIDIA A100 资源池' },
    { id: 'gpu-pool-002', name: '昇腾910B 资源池' },
    { id: 'gpu-pool-003', name: '沐曦C500 资源池' },
  ],
  service: [
    { id: 'service-001', name: 'qwen-chat-api' },
    { id: 'service-002', name: 'deepseek-inference' },
    { id: 'service-003', name: 'glm-service' },
  ],
}

const mockGrantees: Record<string, Resource[]> = {
  user: [
    { id: 'user-001', name: '张三' },
    { id: 'user-002', name: '李四' },
    { id: 'user-003', name: '王五' },
  ],
  role: [
    { id: 'role-developer', name: '开发者' },
    { id: 'role-operator', name: '运维人员' },
    { id: 'role-viewer', name: '访客' },
  ],
  organization: [
    { id: 'org-001', name: '技术研发部' },
    { id: 'org-002', name: '产品部' },
    { id: 'org-003', name: 'AI实验室' },
  ],
}

// 初始化模拟数据
const initMockData = () => {
  const mockPermissions: Permission[] = [
    {
      id: 'perm-001',
      resourceType: 'model',
      resourceId: 'model-001',
      resourceName: 'Qwen2.5-72B-Instruct',
      granteeType: 'user',
      granteeId: 'user-001',
      granteeName: '张三',
      permission: 'owner',
      createdBy: '管理员',
      createdAt: '2024-01-15 10:00:00',
    },
    {
      id: 'perm-002',
      resourceType: 'dataset',
      resourceId: 'dataset-001',
      resourceName: '客服对话数据集',
      granteeType: 'role',
      granteeId: 'role-developer',
      granteeName: '开发者',
      permission: 'read-write',
      createdBy: '管理员',
      createdAt: '2024-02-10 14:30:00',
    },
    {
      id: 'perm-003',
      resourceType: 'gpu',
      resourceId: 'gpu-pool-001',
      resourceName: 'NVIDIA A100 资源池',
      granteeType: 'organization',
      granteeId: 'org-001',
      granteeName: '技术研发部',
      permission: 'read-write',
      createdBy: '管理员',
      createdAt: '2024-03-05 09:20:00',
    },
    {
      id: 'perm-004',
      resourceType: 'service',
      resourceId: 'service-001',
      resourceName: 'qwen-chat-api',
      granteeType: 'role',
      granteeId: 'role-viewer',
      granteeName: '访客',
      permission: 'read-only',
      createdBy: '管理员',
      createdAt: '2024-04-12 16:45:00',
    },
    {
      id: 'perm-005',
      resourceType: 'model',
      resourceId: 'model-002',
      resourceName: 'DeepSeek-V3',
      granteeType: 'user',
      granteeId: 'user-002',
      granteeName: '李四',
      permission: 'read-write',
      createdBy: '管理员',
      createdAt: '2024-05-08 11:15:00',
    },
  ]

  permissions.value = mockPermissions
}

// 加载数据
const loadData = () => {
  initMockData()
}

// 过滤后的权限列表
const filteredPermissions = computed(() => {
  let result = permissions.value

  if (searchForm.value.resourceType) {
    result = result.filter((p) => p.resourceType === searchForm.value.resourceType)
  }

  if (searchForm.value.granteeType) {
    result = result.filter((p) => p.granteeType === searchForm.value.granteeType)
  }

  if (searchForm.value.permission) {
    result = result.filter((p) => p.permission === searchForm.value.permission)
  }

  return result
})

// 分页后的权限列表
const paginatedPermissions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPermissions.value.slice(start, end)
})

// 查询
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const handleReset = () => {
  searchForm.value = {
    resourceType: '',
    granteeType: '',
    permission: '',
  }
  currentPage.value = 1
}

// 创建权限规则
const handleCreatePermission = () => {
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// 编辑权限规则
const handleEdit = (row: Permission) => {
  dialogMode.value = 'edit'
  formData.value = {
    id: row.id,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    granteeType: row.granteeType,
    granteeId: row.granteeId,
    permission: row.permission,
  }
  availableResources.value = mockResources[row.resourceType] || []
  availableGrantees.value = mockGrantees[row.granteeType] || []
  dialogVisible.value = true
}

// 删除权限规则
const handleDelete = (row: Permission) => {
  ElMessageBox.confirm(`确定要删除该权限规则吗? 此操作不可恢复。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error',
  }).then(() => {
    const index = permissions.value.findIndex((p) => p.id === row.id)
    if (index > -1) {
      permissions.value.splice(index, 1)

      ElMessage.success('删除成功')
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate()

  const resource = availableResources.value.find((r) => r.id === formData.value.resourceId)
  const grantee = availableGrantees.value.find((g) => g.id === formData.value.granteeId)

  if (dialogMode.value === 'create') {
    const newPermission: Permission = {
      id: `perm-${Date.now()}`,
      resourceType: formData.value.resourceType as 'model' | 'dataset' | 'gpu' | 'service',
      resourceId: formData.value.resourceId,
      resourceName: resource?.name || '',
      granteeType: formData.value.granteeType as 'user' | 'role' | 'organization',
      granteeId: formData.value.granteeId,
      granteeName: grantee?.name || '',
      permission: formData.value.permission,
      createdBy: '管理员',
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    permissions.value.unshift(newPermission)
    ElMessage.success('创建成功')
  } else {
    const index = permissions.value.findIndex((p) => p.id === formData.value.id)
    if (index > -1) {
      permissions.value[index] = {
        ...permissions.value[index],
        resourceType: formData.value.resourceType as 'model' | 'dataset' | 'gpu' | 'service',
        resourceId: formData.value.resourceId,
        resourceName: resource?.name || '',
        granteeType: formData.value.granteeType as 'user' | 'role' | 'organization',
        granteeId: formData.value.granteeId,
        granteeName: grantee?.name || '',
        permission: formData.value.permission,
      }
      ElMessage.success('更新成功')
    }
  }

  dialogVisible.value = false
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
  formData.value = {
    id: '',
    resourceType: '',
    resourceId: '',
    granteeType: '',
    granteeId: '',
    permission: 'read-only',
  }
  availableResources.value = []
  availableGrantees.value = []
}

// 资源类型变化
const handleResourceTypeChange = (type: string) => {
  formData.value.resourceId = ''
  availableResources.value = mockResources[type] || []
}

// 授权对象类型变化
const handleGranteeTypeChange = (type: string) => {
  formData.value.granteeId = ''
  availableGrantees.value = mockGrantees[type] || []
}

// 工具函数
const getResourceTypeName = (type: string) => {
  const names: Record<string, string> = {
    model: '模型',
    dataset: '数据集',
    gpu: 'GPU资源',
    service: '部署服务',
  }
  return names[type] || type
}

const getResourceTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    model: 'primary',
    dataset: 'success',
    gpu: 'warning',
    service: 'danger',
  }
  return tags[type] || ''
}

const getGranteeTypeName = (type: string) => {
  const names: Record<string, string> = {
    user: '用户',
    role: '角色',
    organization: '组织',
  }
  return names[type] || type
}

const getGranteeTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    user: 'primary',
    role: 'success',
    organization: 'warning',
  }
  return tags[type] || ''
}

const getPermissionName = (permission: string) => {
  const names: Record<string, string> = {
    owner: '所有者',
    'read-write': '读写',
    'read-only': '只读',
  }
  return names[permission] || permission
}

const getPermissionTag = (permission: string) => {
  const tags: Record<string, string> = {
    owner: 'danger',
    'read-write': 'warning',
    'read-only': 'info',
  }
  return tags[permission] || ''
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.resource-permission-page {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .search-form {
    margin-bottom: 16px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
