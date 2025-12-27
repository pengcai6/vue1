<template>
  <div class="audit-log-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">审计日志</span>
          <el-button type="primary" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出日志
          </el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="日志类型">
          <el-select
            v-model="searchForm.logType"
            placeholder="请选择日志类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="登录日志" value="login" />
            <el-option label="操作日志" value="operation" />
            <el-option label="系统日志" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="searchForm.actionType"
            placeholder="请选择操作类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="查询" value="query" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户">
          <el-input
            v-model="searchForm.userName"
            placeholder="请输入用户名"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input
            v-model="searchForm.ipAddress"
            placeholder="请输入IP地址"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 审计日志列表 -->
      <el-table :data="paginatedLogs" border style="width: 100%">
        <el-table-column prop="id" label="日志ID" width="140" />
        <el-table-column prop="logType" label="日志类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLogTypeTag(row.logType)">
              {{ getLogTypeName(row.logType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actionType" label="操作类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getActionTypeTag(row.actionType)">
              {{ getActionTypeName(row.actionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="用户" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column
          prop="description"
          label="操作描述"
          min-width="250"
          show-overflow-tooltip
        />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="userAgent" label="浏览器" width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)"
              >详情</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredLogs.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="日志详情" width="700px">
      <el-descriptions :column="2" border v-if="selectedLog">
        <el-descriptions-item label="日志ID">{{ selectedLog.id }}</el-descriptions-item>
        <el-descriptions-item label="日志类型">
          <el-tag :type="getLogTypeTag(selectedLog.logType)">
            {{ getLogTypeName(selectedLog.logType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getActionTypeTag(selectedLog.actionType)">
            {{ getActionTypeName(selectedLog.actionType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户">{{ selectedLog.userName }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ selectedLog.module }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="selectedLog.status === 'success' ? 'success' : 'danger'">
            {{ selectedLog.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">{{
          selectedLog.description
        }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ selectedLog.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="地理位置">{{ selectedLog.location }}</el-descriptions-item>
        <el-descriptions-item label="浏览器" :span="2">{{
          selectedLog.userAgent
        }}</el-descriptions-item>
        <el-descriptions-item label="时间戳">{{ selectedLog.timestamp }}</el-descriptions-item>
        <el-descriptions-item label="请求耗时">{{ selectedLog.duration }}ms</el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">{{
          selectedLog.requestPath
        }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <el-input
            v-model="selectedLog.requestParams"
            type="textarea"
            :rows="3"
            readonly
            style="font-family: monospace; font-size: 12px"
          />
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

interface AuditLog {
  id: string
  logType: 'login' | 'operation' | 'system'
  actionType: 'create' | 'update' | 'delete' | 'query' | 'login' | 'logout'
  userName: string
  userId: string
  module: string
  description: string
  ipAddress: string
  location: string
  userAgent: string
  status: 'success' | 'failed'
  timestamp: string
  duration: number
  requestPath: string
  requestParams: string
}

const STORAGE_KEY = 'audit_logs_data'

// 搜索表单
const searchForm = ref({
  logType: '',
  actionType: '',
  userName: '',
  ipAddress: '',
  dateRange: [] as any[],
})

// 审计日志列表
const auditLogs = ref<AuditLog[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 详情对话框
const detailDialogVisible = ref(false)
const selectedLog = ref<AuditLog | null>(null)

// 初始化模拟数据
const initMockData = () => {
  const mockLogs: AuditLog[] = [
    {
      id: 'log-001',
      logType: 'login',
      actionType: 'login',
      userName: '张三',
      userId: 'user-001',
      module: '用户认证',
      description: '用户登录系统',
      ipAddress: '192.168.1.100',
      location: '北京市 朝阳区',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      status: 'success',
      timestamp: '2024-06-20 09:15:23',
      duration: 156,
      requestPath: '/api/auth/login',
      requestParams: '{"username": "zhangsan", "loginType": "password"}',
    },
    {
      id: 'log-002',
      logType: 'operation',
      actionType: 'create',
      userName: '张三',
      userId: 'user-001',
      module: '模型部署',
      description: '创建模型部署服务: qwen-chat-api',
      ipAddress: '192.168.1.100',
      location: '北京市 朝阳区',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      status: 'success',
      timestamp: '2024-06-20 09:30:45',
      duration: 2340,
      requestPath: '/api/deployment/create',
      requestParams: '{"modelId": "model-001", "instanceType": "gpu.a100.1x", "replicas": 2}',
    },
    {
      id: 'log-003',
      logType: 'operation',
      actionType: 'update',
      userName: '李四',
      userId: 'user-002',
      module: '数据集管理',
      description: '更新数据集: 客服对话数据集',
      ipAddress: '192.168.1.105',
      location: '上海市 浦东新区',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      status: 'success',
      timestamp: '2024-06-20 10:12:18',
      duration: 567,
      requestPath: '/api/dataset/update',
      requestParams: '{"datasetId": "dataset-001", "description": "更新数据集描述"}',
    },
    {
      id: 'log-004',
      logType: 'operation',
      actionType: 'delete',
      userName: '王五',
      userId: 'user-003',
      module: '模型微调',
      description: '删除微调任务: task-finetune-123',
      ipAddress: '192.168.1.110',
      location: '深圳市 南山区',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0',
      status: 'success',
      timestamp: '2024-06-20 11:25:33',
      duration: 234,
      requestPath: '/api/finetune/delete',
      requestParams: '{"taskId": "task-finetune-123"}',
    },
    {
      id: 'log-005',
      logType: 'login',
      actionType: 'login',
      userName: 'admin',
      userId: 'user-admin',
      module: '用户认证',
      description: '管理员登录失败 - 密码错误',
      ipAddress: '203.0.113.45',
      location: '未知地区',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/120.0',
      status: 'failed',
      timestamp: '2024-06-20 12:05:12',
      duration: 89,
      requestPath: '/api/auth/login',
      requestParams: '{"username": "admin", "loginType": "password"}',
    },
    {
      id: 'log-006',
      logType: 'operation',
      actionType: 'create',
      userName: '赵六',
      userId: 'user-004',
      module: '模型测评',
      description: '创建模型测评任务',
      ipAddress: '192.168.1.115',
      location: '杭州市 西湖区',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      status: 'success',
      timestamp: '2024-06-20 13:40:56',
      duration: 1234,
      requestPath: '/api/evaluation/create',
      requestParams: '{"modelId": "model-002", "benchmarks": ["MMLU", "C-Eval"]}',
    },
    {
      id: 'log-007',
      logType: 'system',
      actionType: 'update',
      userName: 'system',
      userId: 'system',
      module: '系统配置',
      description: '自动扩缩容规则触发 - GPU利用率超过80%',
      ipAddress: '127.0.0.1',
      location: '本地',
      userAgent: 'System Internal',
      status: 'success',
      timestamp: '2024-06-20 14:15:30',
      duration: 3456,
      requestPath: '/internal/autoscaling/trigger',
      requestParams: '{"serviceId": "service-001", "metric": "gpu_utilization", "value": 0.85}',
    },
    {
      id: 'log-008',
      logType: 'operation',
      actionType: 'query',
      userName: '钱七',
      userId: 'user-005',
      module: '模型广场',
      description: '查询模型列表',
      ipAddress: '192.168.1.120',
      location: '广州市 天河区',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
      status: 'success',
      timestamp: '2024-06-20 15:22:45',
      duration: 123,
      requestPath: '/api/models/list',
      requestParams: '{"category": "chat", "pageSize": 20}',
    },
  ]

  auditLogs.value = mockLogs
}

// 加载数据
const loadData = () => {
  initMockData()
}

// 过滤后的日志列表
const filteredLogs = computed(() => {
  let result = auditLogs.value

  if (searchForm.value.logType) {
    result = result.filter((log) => log.logType === searchForm.value.logType)
  }

  if (searchForm.value.actionType) {
    result = result.filter((log) => log.actionType === searchForm.value.actionType)
  }

  if (searchForm.value.userName) {
    result = result.filter((log) =>
      log.userName.toLowerCase().includes(searchForm.value.userName.toLowerCase()),
    )
  }

  if (searchForm.value.ipAddress) {
    result = result.filter((log) => log.ipAddress.includes(searchForm.value.ipAddress))
  }

  if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
    const [start, end] = searchForm.value.dateRange
    result = result.filter((log) => {
      const logTime = new Date(log.timestamp).getTime()
      return logTime >= start.getTime() && logTime <= end.getTime()
    })
  }

  return result
})

// 分页后的日志列表
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLogs.value.slice(start, end)
})

// 查询
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const handleReset = () => {
  searchForm.value = {
    logType: '',
    actionType: '',
    userName: '',
    ipAddress: '',
    dateRange: [],
  }
  currentPage.value = 1
}

// 查看详情
const handleViewDetail = (row: AuditLog) => {
  selectedLog.value = row
  detailDialogVisible.value = true
}

// 导出日志
const handleExport = () => {
  const headers = [
    '日志ID',
    '日志类型',
    '操作类型',
    '用户',
    '模块',
    '操作描述',
    'IP地址',
    '状态',
    '时间',
  ]
  const rows = filteredLogs.value.map((log) => [
    log.id,
    getLogTypeName(log.logType),
    getActionTypeName(log.actionType),
    log.userName,
    log.module,
    `"${log.description.replace(/"/g, '""')}"`,
    log.ipAddress,
    log.status === 'success' ? '成功' : '失败',
    log.timestamp,
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-logs-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('日志导出成功')
}

// 工具函数
const getLogTypeName = (type: string) => {
  const names: Record<string, string> = {
    login: '登录',
    operation: '操作',
    system: '系统',
  }
  return names[type] || type
}

const getLogTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    login: 'primary',
    operation: 'success',
    system: 'warning',
  }
  return tags[type] || ''
}

const getActionTypeName = (type: string) => {
  const names: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    query: '查询',
    login: '登录',
    logout: '登出',
  }
  return names[type] || type
}

const getActionTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    query: 'info',
    login: 'primary',
    logout: 'info',
  }
  return tags[type] || ''
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
.audit-log-page {
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
