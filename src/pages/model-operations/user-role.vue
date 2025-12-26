<template>
  <div class="user-role-page">
    <el-row :gutter="20">
      <!-- 左侧：用户管理 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">用户管理</span>
              <el-button type="primary" size="small" @click="handleCreateUser">
                <el-icon><Plus /></el-icon>
                添加用户
              </el-button>
            </div>
          </template>

          <!-- 搜索栏 -->
          <el-form :inline="true" class="search-form">
            <el-form-item label="用户名">
              <el-input v-model="userSearchForm.userName" placeholder="请输入用户名" clearable style="width: 150px" />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="userSearchForm.roleId" placeholder="请选择角色" clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="userSearchForm.status" placeholder="请选择状态" clearable style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="正常" value="active" />
                <el-option label="已禁用" value="disabled" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearchUser">查询</el-button>
              <el-button @click="handleResetUser">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 用户列表 -->
          <el-table :data="paginatedUsers" border style="width: 100%">
            <el-table-column prop="userId" label="用户ID" width="150" />
            <el-table-column prop="userName" label="用户名" width="120" />
            <el-table-column prop="email" label="邮箱" width="180" />
            <el-table-column prop="roleName" label="角色" width="120">
              <template #default="{ row }">
                <el-tag :type="getRoleTagType(row.roleId)">{{ row.roleName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '正常' : '已禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEditUser(row)">编辑</el-button>
                <el-button link type="primary" size="small" @click="handleAssignRole(row)">分配角色</el-button>
                <el-button
                  link
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  size="small"
                  @click="handleToggleUserStatus(row)"
                >
                  {{ row.status === 'active' ? '禁用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="userCurrentPage"
              v-model:page-size="userPageSize"
              :page-sizes="[10, 20, 50]"
              :total="filteredUsers.length"
              layout="total, sizes, prev, pager, next"
              @size-change="handleUserSizeChange"
              @current-change="handleUserCurrentChange"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：角色管理 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">角色管理</span>
              <el-button type="primary" size="small" @click="handleCreateRole">
                <el-icon><Plus /></el-icon>
                添加角色
              </el-button>
            </div>
          </template>

          <!-- 角色列表 -->
          <el-table :data="roles" border style="width: 100%">
            <el-table-column prop="name" label="角色名称" width="140" />
            <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
            <el-table-column prop="userCount" label="用户数" width="80" align="center" />
            <el-table-column label="操作" width="160">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEditRole(row)">编辑</el-button>
                <el-button link type="primary" size="small" @click="handleViewPermissions(row)">权限</el-button>
                <el-button
                  link
                  type="danger"
                  size="small"
                  @click="handleDeleteRole(row)"
                  :disabled="row.isSystem"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 权限树 -->
        <el-card style="margin-top: 20px" v-if="selectedRole">
          <template #header>
            <div class="card-header">
              <span class="title">{{ selectedRole.name }} - 权限配置</span>
            </div>
          </template>
          <el-tree
            ref="permissionTreeRef"
            :data="permissionTree"
            :props="{ label: 'label', children: 'children' }"
            node-key="id"
            show-checkbox
            :default-checked-keys="selectedRolePermissions"
            @check="handlePermissionCheck"
          />
          <div style="margin-top: 16px; text-align: right">
            <el-button type="primary" size="small" @click="handleSavePermissions">保存权限</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="userDialogMode === 'create' ? '添加用户' : '编辑用户'"
      width="500px"
      @close="handleUserDialogClose"
    >
      <el-form :model="userFormData" :rules="userFormRules" ref="userFormRef" label-width="80px">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="userFormData.userName" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userFormData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="userFormData.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userFormData.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitUser">确定</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑角色对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      :title="roleDialogMode === 'create' ? '添加角色' : '编辑角色'"
      width="500px"
      @close="handleRoleDialogClose"
    >
      <el-form :model="roleFormData" :rules="roleFormRules" ref="roleFormRef" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleFormData.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="roleFormData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getStorage, setStorage } from '@/utils/storage'

interface User {
  userId: string
  userName: string
  email: string
  roleId: string
  roleName: string
  status: 'active' | 'disabled'
  createdAt: string
}

interface Role {
  id: string
  name: string
  description: string
  userCount: number
  isSystem?: boolean
  permissions?: string[]
}

interface PermissionNode {
  id: string
  label: string
  children?: PermissionNode[]
}

const USERS_STORAGE_KEY = 'rbac_users_data'
const ROLES_STORAGE_KEY = 'rbac_roles_data'
const ROLE_PERMISSIONS_KEY = 'rbac_role_permissions_data'

// 用户管理
const users = ref<User[]>([])
const userSearchForm = ref({
  userName: '',
  roleId: '',
  status: '',
})
const userCurrentPage = ref(1)
const userPageSize = ref(10)
const userDialogVisible = ref(false)
const userDialogMode = ref<'create' | 'edit'>('create')
const userFormRef = ref()
const userFormData = ref({
  userId: '',
  userName: '',
  email: '',
  roleId: '',
  status: 'active' as 'active' | 'disabled',
})
const userFormRules = {
  userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

// 角色管理
const roles = ref<Role[]>([])
const roleDialogVisible = ref(false)
const roleDialogMode = ref<'create' | 'edit'>('create')
const roleFormRef = ref()
const roleFormData = ref({
  id: '',
  name: '',
  description: '',
})
const roleFormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }],
}

// 权限管理
const selectedRole = ref<Role | null>(null)
const permissionTreeRef = ref()
const rolePermissions = ref<Record<string, string[]>>({})

const permissionTree: PermissionNode[] = [
  {
    id: 'model',
    label: '模型管理',
    children: [
      { id: 'model.view', label: '查看模型' },
      { id: 'model.deploy', label: '部署模型' },
      { id: 'model.delete', label: '删除模型' },
    ],
  },
  {
    id: 'dataset',
    label: '数据集管理',
    children: [
      { id: 'dataset.view', label: '查看数据集' },
      { id: 'dataset.create', label: '创建数据集' },
      { id: 'dataset.edit', label: '编辑数据集' },
      { id: 'dataset.delete', label: '删除数据集' },
    ],
  },
  {
    id: 'finetune',
    label: '模型微调',
    children: [
      { id: 'finetune.view', label: '查看任务' },
      { id: 'finetune.create', label: '创建任务' },
      { id: 'finetune.stop', label: '停止任务' },
    ],
  },
  {
    id: 'resource',
    label: '资源管理',
    children: [
      { id: 'resource.view', label: '查看资源' },
      { id: 'resource.allocate', label: '分配资源' },
      { id: 'resource.release', label: '释放资源' },
    ],
  },
  {
    id: 'user',
    label: '用户管理',
    children: [
      { id: 'user.view', label: '查看用户' },
      { id: 'user.create', label: '创建用户' },
      { id: 'user.edit', label: '编辑用户' },
      { id: 'user.delete', label: '删除用户' },
    ],
  },
]

const selectedRolePermissions = computed(() => {
  return selectedRole.value ? rolePermissions.value[selectedRole.value.id] || [] : []
})

// 初始化模拟数据
const initMockData = () => {
  const mockRoles: Role[] = [
    {
      id: 'role-admin',
      name: '系统管理员',
      description: '拥有系统所有权限',
      userCount: 2,
      isSystem: true,
    },
    {
      id: 'role-developer',
      name: '开发者',
      description: '可以部署模型、创建微调任务',
      userCount: 15,
      isSystem: false,
    },
    {
      id: 'role-operator',
      name: '运维人员',
      description: '负责资源管理和监控',
      userCount: 5,
      isSystem: false,
    },
    {
      id: 'role-viewer',
      name: '访客',
      description: '只有查看权限',
      userCount: 20,
      isSystem: false,
    },
  ]

  const mockUsers: User[] = [
    {
      userId: 'user-001',
      userName: '管理员',
      email: 'admin@example.com',
      roleId: 'role-admin',
      roleName: '系统管理员',
      status: 'active',
      createdAt: '2024-01-10 10:00:00',
    },
    {
      userId: 'user-002',
      userName: '张三',
      email: 'zhangsan@example.com',
      roleId: 'role-developer',
      roleName: '开发者',
      status: 'active',
      createdAt: '2024-02-15 09:30:00',
    },
    {
      userId: 'user-003',
      userName: '李四',
      email: 'lisi@example.com',
      roleId: 'role-developer',
      roleName: '开发者',
      status: 'active',
      createdAt: '2024-03-20 14:20:00',
    },
    {
      userId: 'user-004',
      userName: '王五',
      email: 'wangwu@example.com',
      roleId: 'role-operator',
      roleName: '运维人员',
      status: 'active',
      createdAt: '2024-04-12 11:15:00',
    },
    {
      userId: 'user-005',
      userName: '赵六',
      email: 'zhaoliu@example.com',
      roleId: 'role-viewer',
      roleName: '访客',
      status: 'active',
      createdAt: '2024-05-08 16:45:00',
    },
    {
      userId: 'user-006',
      userName: '钱七',
      email: 'qianqi@example.com',
      roleId: 'role-viewer',
      roleName: '访客',
      status: 'disabled',
      createdAt: '2024-06-01 10:20:00',
    },
  ]

  const mockPermissions: Record<string, string[]> = {
    'role-admin': [
      'model.view',
      'model.deploy',
      'model.delete',
      'dataset.view',
      'dataset.create',
      'dataset.edit',
      'dataset.delete',
      'finetune.view',
      'finetune.create',
      'finetune.stop',
      'resource.view',
      'resource.allocate',
      'resource.release',
      'user.view',
      'user.create',
      'user.edit',
      'user.delete',
    ],
    'role-developer': [
      'model.view',
      'model.deploy',
      'dataset.view',
      'dataset.create',
      'finetune.view',
      'finetune.create',
      'finetune.stop',
      'resource.view',
    ],
    'role-operator': [
      'model.view',
      'dataset.view',
      'resource.view',
      'resource.allocate',
      'resource.release',
    ],
    'role-viewer': ['model.view', 'dataset.view', 'finetune.view', 'resource.view'],
  }

  roles.value = mockRoles
  users.value = mockUsers
  rolePermissions.value = mockPermissions

  setStorage(ROLES_STORAGE_KEY, mockRoles)
  setStorage(USERS_STORAGE_KEY, mockUsers)
  setStorage(ROLE_PERMISSIONS_KEY, mockPermissions)
}

// 加载数据
const loadData = () => {
  const savedRoles = getStorage(ROLES_STORAGE_KEY)
  const savedUsers = getStorage(USERS_STORAGE_KEY)
  const savedPermissions = getStorage(ROLE_PERMISSIONS_KEY)

  if (savedRoles && Array.isArray(savedRoles) && savedRoles.length > 0) {
    roles.value = savedRoles
    users.value = savedUsers || []
    rolePermissions.value = savedPermissions || {}
  } else {
    initMockData()
  }
}

// 过滤用户
const filteredUsers = computed(() => {
  let result = users.value

  if (userSearchForm.value.userName) {
    result = result.filter((user) =>
      user.userName.toLowerCase().includes(userSearchForm.value.userName.toLowerCase())
    )
  }

  if (userSearchForm.value.roleId) {
    result = result.filter((user) => user.roleId === userSearchForm.value.roleId)
  }

  if (userSearchForm.value.status) {
    result = result.filter((user) => user.status === userSearchForm.value.status)
  }

  return result
})

// 分页用户
const paginatedUsers = computed(() => {
  const start = (userCurrentPage.value - 1) * userPageSize.value
  const end = start + userPageSize.value
  return filteredUsers.value.slice(start, end)
})

// 用户操作
const handleSearchUser = () => {
  userCurrentPage.value = 1
}

const handleResetUser = () => {
  userSearchForm.value = {
    userName: '',
    roleId: '',
    status: '',
  }
  userCurrentPage.value = 1
}

const handleCreateUser = () => {
  userDialogMode.value = 'create'
  userDialogVisible.value = true
}

const handleEditUser = (row: User) => {
  userDialogMode.value = 'edit'
  userFormData.value = {
    userId: row.userId,
    userName: row.userName,
    email: row.email,
    roleId: row.roleId,
    status: row.status,
  }
  userDialogVisible.value = true
}

const handleAssignRole = (row: User) => {
  ElMessage.info('分配角色功能（演示模式）')
}

const handleToggleUserStatus = (row: User) => {
  const action = row.status === 'active' ? '禁用' : '启用'
  ElMessageBox.confirm(`确定要${action}用户"${row.userName}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    row.status = row.status === 'active' ? 'disabled' : 'active'
    setStorage(USERS_STORAGE_KEY, users.value)
    ElMessage.success(`${action}成功`)
  })
}

const handleSubmitUser = async () => {
  await userFormRef.value.validate()

  const role = roles.value.find((r) => r.id === userFormData.value.roleId)

  if (userDialogMode.value === 'create') {
    const newUser: User = {
      ...userFormData.value,
      userId: `user-${Date.now()}`,
      roleName: role?.name || '',
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    users.value.unshift(newUser)

    // 更新角色用户数
    if (role) {
      role.userCount++
      setStorage(ROLES_STORAGE_KEY, roles.value)
    }

    ElMessage.success('添加用户成功')
  } else {
    const index = users.value.findIndex((u) => u.userId === userFormData.value.userId)
    if (index > -1) {
      const oldRoleId = users.value[index].roleId
      users.value[index] = {
        ...users.value[index],
        ...userFormData.value,
        roleName: role?.name || '',
      }

      // 更新角色用户数
      if (oldRoleId !== userFormData.value.roleId) {
        const oldRole = roles.value.find((r) => r.id === oldRoleId)
        if (oldRole) oldRole.userCount--
        if (role) role.userCount++
        setStorage(ROLES_STORAGE_KEY, roles.value)
      }

      ElMessage.success('更新用户成功')
    }
  }

  setStorage(USERS_STORAGE_KEY, users.value)
  userDialogVisible.value = false
}

const handleUserDialogClose = () => {
  userFormRef.value?.resetFields()
  userFormData.value = {
    userId: '',
    userName: '',
    email: '',
    roleId: '',
    status: 'active',
  }
}

// 角色操作
const handleCreateRole = () => {
  roleDialogMode.value = 'create'
  roleDialogVisible.value = true
}

const handleEditRole = (row: Role) => {
  roleDialogMode.value = 'edit'
  roleFormData.value = {
    id: row.id,
    name: row.name,
    description: row.description,
  }
  roleDialogVisible.value = true
}

const handleDeleteRole = (row: Role) => {
  if (row.userCount > 0) {
    ElMessage.warning('该角色下还有用户,无法删除')
    return
  }

  ElMessageBox.confirm(`确定要删除角色"${row.name}"吗? 此操作不可恢复。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error',
  }).then(() => {
    const index = roles.value.findIndex((r) => r.id === row.id)
    if (index > -1) {
      roles.value.splice(index, 1)
      setStorage(ROLES_STORAGE_KEY, roles.value)
      ElMessage.success('删除成功')
    }
  })
}

const handleSubmitRole = async () => {
  await roleFormRef.value.validate()

  if (roleDialogMode.value === 'create') {
    const newRole: Role = {
      ...roleFormData.value,
      id: `role-${Date.now()}`,
      userCount: 0,
      isSystem: false,
    }
    roles.value.push(newRole)
    rolePermissions.value[newRole.id] = []
    ElMessage.success('创建角色成功')
  } else {
    const index = roles.value.findIndex((r) => r.id === roleFormData.value.id)
    if (index > -1) {
      roles.value[index] = { ...roles.value[index], ...roleFormData.value }
      ElMessage.success('更新角色成功')
    }
  }

  setStorage(ROLES_STORAGE_KEY, roles.value)
  setStorage(ROLE_PERMISSIONS_KEY, rolePermissions.value)
  roleDialogVisible.value = false
}

const handleRoleDialogClose = () => {
  roleFormRef.value?.resetFields()
  roleFormData.value = {
    id: '',
    name: '',
    description: '',
  }
}

// 权限操作
const handleViewPermissions = (row: Role) => {
  selectedRole.value = row
}

const handlePermissionCheck = () => {
  // 权限变更时的处理
}

const handleSavePermissions = () => {
  if (!selectedRole.value) return

  const checkedKeys = permissionTreeRef.value.getCheckedKeys()
  rolePermissions.value[selectedRole.value.id] = checkedKeys
  setStorage(ROLE_PERMISSIONS_KEY, rolePermissions.value)
  ElMessage.success('权限保存成功')
}

// 工具函数
const getRoleTagType = (roleId: string) => {
  if (roleId === 'role-admin') return 'danger'
  if (roleId === 'role-developer') return 'success'
  if (roleId === 'role-operator') return 'warning'
  return 'info'
}

const handleUserSizeChange = (val: number) => {
  userPageSize.value = val
  userCurrentPage.value = 1
}

const handleUserCurrentChange = (val: number) => {
  userCurrentPage.value = val
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.user-role-page {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
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
