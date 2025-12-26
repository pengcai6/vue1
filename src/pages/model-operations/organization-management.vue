<template>
  <div class="organization-management-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">组织管理</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            创建组织
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="组织名称">
          <el-input v-model="searchForm.name" placeholder="请输入组织名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="正常" value="normal" />
            <el-option label="已停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 组织列表表格 -->
      <el-table :data="filteredOrganizations" border style="width: 100%">
        <el-table-column prop="id" label="组织ID" width="180" />
        <el-table-column prop="name" label="组织名称" width="200" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="memberCount" label="成员数" width="100" align="center" />
        <el-table-column prop="admin" label="管理员" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'">
              {{ row.status === 'normal' ? '正常' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleViewMembers(row)">成员管理</el-button>
            <el-button
              link
              :type="row.status === 'normal' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'normal' ? '停用' : '启用' }}
            </el-button>
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
          :total="filteredOrganizations.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑组织对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '创建组织' : '编辑组织'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入组织名称" />
        </el-form-item>
        <el-form-item label="组织描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入组织描述"
          />
        </el-form-item>
        <el-form-item label="管理员" prop="admin">
          <el-input v-model="formData.admin" placeholder="请输入管理员名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="normal">正常</el-radio>
            <el-radio label="disabled">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 成员管理对话框 -->
    <el-dialog v-model="memberDialogVisible" title="成员管理" width="800px">
      <div class="member-management">
        <el-button type="primary" size="small" @click="handleAddMember" style="margin-bottom: 16px">
          <el-icon><Plus /></el-icon>
          添加成员
        </el-button>
        <el-table :data="currentMembers" border>
          <el-table-column prop="userId" label="用户ID" width="180" />
          <el-table-column prop="userName" label="用户名" width="150" />
          <el-table-column prop="email" label="邮箱" width="200" />
          <el-table-column prop="role" label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
                {{ row.role === 'admin' ? '管理员' : '成员' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="joinedAt" label="加入时间" width="180" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleChangeRole(row)">
                变更角色
              </el-button>
              <el-button link type="danger" size="small" @click="handleRemoveMember(row)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getStorage, setStorage } from '@/utils/storage'

interface Organization {
  id: string
  name: string
  description: string
  memberCount: number
  admin: string
  createdAt: string
  status: 'normal' | 'disabled'
}

interface Member {
  userId: string
  userName: string
  email: string
  role: 'admin' | 'member'
  joinedAt: string
}

const STORAGE_KEY = 'organizations_data'
const MEMBERS_STORAGE_KEY = 'organization_members_data'

// 搜索表单
const searchForm = ref({
  name: '',
  status: '',
})

// 组织列表
const organizations = ref<Organization[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref()
const formData = ref({
  id: '',
  name: '',
  description: '',
  admin: '',
  status: 'normal' as 'normal' | 'disabled',
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入组织名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入组织描述', trigger: 'blur' }],
  admin: [{ required: true, message: '请输入管理员名称', trigger: 'blur' }],
}

// 成员管理
const memberDialogVisible = ref(false)
const currentOrgId = ref('')
const organizationMembers = ref<Record<string, Member[]>>({})
const currentMembers = computed(() => organizationMembers.value[currentOrgId.value] || [])

// 初始化模拟数据
const initMockData = () => {
  const mockOrganizations: Organization[] = [
    {
      id: 'org-001',
      name: '技术研发部',
      description: '负责公司核心技术研发和创新',
      memberCount: 25,
      admin: '张三',
      createdAt: '2024-01-15 10:30:00',
      status: 'normal',
    },
    {
      id: 'org-002',
      name: '产品部',
      description: '负责产品规划、设计和管理',
      memberCount: 18,
      admin: '李四',
      createdAt: '2024-02-20 14:20:00',
      status: 'normal',
    },
    {
      id: 'org-003',
      name: '市场营销部',
      description: '负责市场推广和品牌建设',
      memberCount: 12,
      admin: '王五',
      createdAt: '2024-03-10 09:15:00',
      status: 'normal',
    },
    {
      id: 'org-004',
      name: 'AI实验室',
      description: '专注于人工智能技术研究与应用',
      memberCount: 30,
      admin: '赵六',
      createdAt: '2024-04-05 11:00:00',
      status: 'normal',
    },
    {
      id: 'org-005',
      name: '数据中心',
      description: '负责数据管理和数据分析',
      memberCount: 8,
      admin: '钱七',
      createdAt: '2024-05-12 16:45:00',
      status: 'disabled',
    },
  ]

  const mockMembers: Record<string, Member[]> = {
    'org-001': [
      {
        userId: 'user-001',
        userName: '张三',
        email: 'zhangsan@example.com',
        role: 'admin',
        joinedAt: '2024-01-15 10:30:00',
      },
      {
        userId: 'user-002',
        userName: '李明',
        email: 'liming@example.com',
        role: 'member',
        joinedAt: '2024-01-16 09:20:00',
      },
      {
        userId: 'user-003',
        userName: '王芳',
        email: 'wangfang@example.com',
        role: 'member',
        joinedAt: '2024-01-18 14:30:00',
      },
    ],
    'org-002': [
      {
        userId: 'user-004',
        userName: '李四',
        email: 'lisi@example.com',
        role: 'admin',
        joinedAt: '2024-02-20 14:20:00',
      },
      {
        userId: 'user-005',
        userName: '陈伟',
        email: 'chenwei@example.com',
        role: 'member',
        joinedAt: '2024-02-21 10:00:00',
      },
    ],
  }

  organizations.value = mockOrganizations
  organizationMembers.value = mockMembers
  setStorage(STORAGE_KEY, mockOrganizations)
  setStorage(MEMBERS_STORAGE_KEY, mockMembers)
}

// 加载数据
const loadData = () => {
  const savedOrgs = getStorage(STORAGE_KEY)
  const savedMembers = getStorage(MEMBERS_STORAGE_KEY)

  if (savedOrgs && Array.isArray(savedOrgs) && savedOrgs.length > 0) {
    organizations.value = savedOrgs
  } else {
    initMockData()
  }

  if (savedMembers) {
    organizationMembers.value = savedMembers
  }
}

// 过滤后的组织列表
const filteredOrganizations = computed(() => {
  let result = organizations.value

  if (searchForm.value.name) {
    result = result.filter((org) =>
      org.name.toLowerCase().includes(searchForm.value.name.toLowerCase())
    )
  }

  if (searchForm.value.status) {
    result = result.filter((org) => org.status === searchForm.value.status)
  }

  return result
})

// 查询
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const handleReset = () => {
  searchForm.value = {
    name: '',
    status: '',
  }
  currentPage.value = 1
}

// 创建组织
const handleCreate = () => {
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// 编辑组织
const handleEdit = (row: Organization) => {
  dialogMode.value = 'edit'
  formData.value = { ...row }
  dialogVisible.value = true
}

// 切换状态
const handleToggleStatus = (row: Organization) => {
  const action = row.status === 'normal' ? '停用' : '启用'
  ElMessageBox.confirm(`确定要${action}组织"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    row.status = row.status === 'normal' ? 'disabled' : 'normal'
    setStorage(STORAGE_KEY, organizations.value)
    ElMessage.success(`${action}成功`)
  })
}

// 删除组织
const handleDelete = (row: Organization) => {
  ElMessageBox.confirm(`确定要删除组织"${row.name}"吗? 此操作不可恢复。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error',
  }).then(() => {
    const index = organizations.value.findIndex((org) => org.id === row.id)
    if (index > -1) {
      organizations.value.splice(index, 1)
      setStorage(STORAGE_KEY, organizations.value)
      ElMessage.success('删除成功')
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate()

  if (dialogMode.value === 'create') {
    const newOrg: Organization = {
      ...formData.value,
      id: `org-${Date.now()}`,
      memberCount: 0,
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    organizations.value.unshift(newOrg)
    ElMessage.success('创建成功')
  } else {
    const index = organizations.value.findIndex((org) => org.id === formData.value.id)
    if (index > -1) {
      organizations.value[index] = { ...organizations.value[index], ...formData.value }
      ElMessage.success('更新成功')
    }
  }

  setStorage(STORAGE_KEY, organizations.value)
  dialogVisible.value = false
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
  formData.value = {
    id: '',
    name: '',
    description: '',
    admin: '',
    status: 'normal',
  }
}

// 查看成员
const handleViewMembers = (row: Organization) => {
  currentOrgId.value = row.id
  memberDialogVisible.value = true
}

// 添加成员
const handleAddMember = () => {
  ElMessage.info('添加成员功能（演示模式）')
}

// 变更角色
const handleChangeRole = (member: Member) => {
  const newRole = member.role === 'admin' ? 'member' : 'admin'
  ElMessageBox.confirm(`确定要将"${member.userName}"的角色变更为${newRole === 'admin' ? '管理员' : '成员'}吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(() => {
    member.role = newRole
    setStorage(MEMBERS_STORAGE_KEY, organizationMembers.value)
    ElMessage.success('角色变更成功')
  })
}

// 移除成员
const handleRemoveMember = (member: Member) => {
  ElMessageBox.confirm(`确定要移除成员"${member.userName}"吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const members = organizationMembers.value[currentOrgId.value]
    const index = members.findIndex((m) => m.userId === member.userId)
    if (index > -1) {
      members.splice(index, 1)
      setStorage(MEMBERS_STORAGE_KEY, organizationMembers.value)
      
      // 更新成员数量
      const org = organizations.value.find((o) => o.id === currentOrgId.value)
      if (org) {
        org.memberCount = members.length
        setStorage(STORAGE_KEY, organizations.value)
      }
      
      ElMessage.success('移除成功')
    }
  })
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
.organization-management-page {
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

  .member-management {
    padding: 0;
  }
}
</style>
