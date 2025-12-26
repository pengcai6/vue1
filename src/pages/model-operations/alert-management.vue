<template>
  <div class="alert-management-page">
    <el-row :gutter="20">
      <!-- 左侧：告警规则列表 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">告警规则</span>
              <el-button type="primary" size="small" @click="handleCreateRule">
                <el-icon><Plus /></el-icon>
                创建规则
              </el-button>
            </div>
          </template>

          <!-- 筛选栏 -->
          <el-form :inline="true" class="search-form">
            <el-form-item label="规则名称">
              <el-input v-model="ruleSearchForm.name" placeholder="请输入规则名称" clearable style="width: 150px" />
            </el-form-item>
            <el-form-item label="告警级别">
              <el-select v-model="ruleSearchForm.severity" placeholder="请选择级别" clearable style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="严重" value="critical" />
                <el-option label="警告" value="warning" />
                <el-option label="信息" value="info" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="ruleSearchForm.enabled" placeholder="请选择状态" clearable style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="已启用" value="true" />
                <el-option label="已禁用" value="false" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearchRule">查询</el-button>
              <el-button @click="handleResetRule">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 规则列表 -->
          <el-table :data="filteredRules" border style="width: 100%">
            <el-table-column prop="name" label="规则名称" width="180" show-overflow-tooltip />
            <el-table-column prop="metric" label="监控指标" width="150">
              <template #default="{ row }">
                {{ getMetricName(row.metric) }}
              </template>
            </el-table-column>
            <el-table-column prop="condition" label="触发条件" width="140" show-overflow-tooltip />
            <el-table-column prop="severity" label="告警级别" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getSeverityTag(row.severity)">
                  {{ getSeverityName(row.severity) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.enabled"
                  @change="handleToggleRuleStatus(row)"
                  :active-text="row.enabled ? '已启用' : '已禁用'"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEditRule(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDeleteRule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：告警历史 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">告警历史</span>
              <el-button type="default" size="small" @click="handleRefreshAlerts">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <!-- 告警统计 -->
          <el-row :gutter="10" style="margin-bottom: 16px">
            <el-col :span="8">
              <el-card shadow="hover" :body-style="{ padding: '12px' }">
                <el-statistic title="严重" :value="alertStats.critical">
                  <template #suffix>
                    <span style="font-size: 14px; color: #f56c6c">条</span>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" :body-style="{ padding: '12px' }">
                <el-statistic title="警告" :value="alertStats.warning">
                  <template #suffix>
                    <span style="font-size: 14px; color: #e6a23c">条</span>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" :body-style="{ padding: '12px' }">
                <el-statistic title="信息" :value="alertStats.info">
                  <template #suffix>
                    <span style="font-size: 14px; color: #909399">条</span>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
          </el-row>

          <!-- 告警列表 -->
          <el-timeline>
            <el-timeline-item
              v-for="alert in recentAlerts"
              :key="alert.id"
              :timestamp="alert.timestamp"
              :type="getSeverityTimelineType(alert.severity)"
            >
              <el-card shadow="hover">
                <div class="alert-item">
                  <div class="alert-header">
                    <el-tag :type="getSeverityTag(alert.severity)" size="small">
                      {{ getSeverityName(alert.severity) }}
                    </el-tag>
                    <span class="alert-title">{{ alert.ruleName }}</span>
                  </div>
                  <div class="alert-content">{{ alert.message }}</div>
                  <div class="alert-footer">
                    <span class="alert-service">{{ alert.serviceName }}</span>
                    <el-button
                      v-if="alert.status === 'active'"
                      link
                      type="primary"
                      size="small"
                      @click="handleResolveAlert(alert)"
                    >
                      标记已解决
                    </el-button>
                    <el-tag v-else type="success" size="small">已解决</el-tag>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>

          <div v-if="recentAlerts.length === 0" class="empty-state">
            <el-empty description="暂无告警记录" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 创建/编辑规则对话框 -->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="ruleDialogMode === 'create' ? '创建告警规则' : '编辑告警规则'"
      width="600px"
      @close="handleRuleDialogClose"
    >
      <el-form :model="ruleFormData" :rules="ruleFormRules" ref="ruleFormRef" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleFormData.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="监控指标" prop="metric">
          <el-select v-model="ruleFormData.metric" placeholder="请选择监控指标" style="width: 100%">
            <el-option label="GPU利用率" value="gpu_utilization" />
            <el-option label="内存使用率" value="memory_usage" />
            <el-option label="请求延迟" value="request_latency" />
            <el-option label="错误率" value="error_rate" />
            <el-option label="QPS" value="qps" />
            <el-option label="Pod状态" value="pod_status" />
          </el-select>
        </el-form-item>
        <el-form-item label="比较运算符" prop="operator">
          <el-select v-model="ruleFormData.operator" placeholder="请选择运算符" style="width: 100%">
            <el-option label="大于 >" value="gt" />
            <el-option label="大于等于 >=" value="gte" />
            <el-option label="小于 <" value="lt" />
            <el-option label="小于等于 <=" value="lte" />
            <el-option label="等于 ==" value="eq" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" prop="threshold">
          <el-input-number v-model="ruleFormData.threshold" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="持续时间" prop="duration">
          <el-input-number v-model="ruleFormData.duration" :min="1" :max="60" style="width: 100%" />
          <span style="margin-left: 8px; color: #909399">分钟</span>
        </el-form-item>
        <el-form-item label="告警级别" prop="severity">
          <el-radio-group v-model="ruleFormData.severity">
            <el-radio label="critical">严重</el-radio>
            <el-radio label="warning">警告</el-radio>
            <el-radio label="info">信息</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通知方式" prop="notifyChannels">
          <el-checkbox-group v-model="ruleFormData.notifyChannels">
            <el-checkbox label="email">邮件</el-checkbox>
            <el-checkbox label="sms">短信</el-checkbox>
            <el-checkbox label="webhook">Webhook</el-checkbox>
            <el-checkbox label="wechat">企业微信</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="启用规则" prop="enabled">
          <el-switch v-model="ruleFormData.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRule">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { getStorage, setStorage } from '@/utils/storage'

interface AlertRule {
  id: string
  name: string
  metric: string
  operator: string
  threshold: number
  duration: number
  condition: string
  severity: 'critical' | 'warning' | 'info'
  notifyChannels: string[]
  enabled: boolean
  createdAt: string
}

interface Alert {
  id: string
  ruleId: string
  ruleName: string
  severity: 'critical' | 'warning' | 'info'
  serviceName: string
  message: string
  timestamp: string
  status: 'active' | 'resolved'
}

const RULES_STORAGE_KEY = 'alert_rules_data'
const ALERTS_STORAGE_KEY = 'alerts_data'

// 规则管理
const alertRules = ref<AlertRule[]>([])
const ruleSearchForm = ref({
  name: '',
  severity: '',
  enabled: '',
})
const ruleDialogVisible = ref(false)
const ruleDialogMode = ref<'create' | 'edit'>('create')
const ruleFormRef = ref()
const ruleFormData = ref({
  id: '',
  name: '',
  metric: '',
  operator: 'gt',
  threshold: 80,
  duration: 5,
  severity: 'warning' as 'critical' | 'warning' | 'info',
  notifyChannels: [] as string[],
  enabled: true,
})
const ruleFormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  metric: [{ required: true, message: '请选择监控指标', trigger: 'change' }],
  operator: [{ required: true, message: '请选择运算符', trigger: 'change' }],
  threshold: [{ required: true, message: '请输入阈值', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入持续时间', trigger: 'blur' }],
  severity: [{ required: true, message: '请选择告警级别', trigger: 'change' }],
}

// 告警历史
const alerts = ref<Alert[]>([])
const recentAlerts = computed(() => alerts.value.slice(0, 10))
const alertStats = computed(() => {
  const activeAlerts = alerts.value.filter((a) => a.status === 'active')
  return {
    critical: activeAlerts.filter((a) => a.severity === 'critical').length,
    warning: activeAlerts.filter((a) => a.severity === 'warning').length,
    info: activeAlerts.filter((a) => a.severity === 'info').length,
  }
})

// 初始化模拟数据
const initMockData = () => {
  const mockRules: AlertRule[] = [
    {
      id: 'rule-001',
      name: 'GPU利用率过高',
      metric: 'gpu_utilization',
      operator: 'gt',
      threshold: 85,
      duration: 5,
      condition: '> 85% 持续5分钟',
      severity: 'critical',
      notifyChannels: ['email', 'sms', 'wechat'],
      enabled: true,
      createdAt: '2024-01-10 10:00:00',
    },
    {
      id: 'rule-002',
      name: '请求延迟告警',
      metric: 'request_latency',
      operator: 'gt',
      threshold: 3000,
      duration: 3,
      condition: '> 3000ms 持续3分钟',
      severity: 'warning',
      notifyChannels: ['email', 'webhook'],
      enabled: true,
      createdAt: '2024-02-15 14:30:00',
    },
    {
      id: 'rule-003',
      name: '错误率异常',
      metric: 'error_rate',
      operator: 'gt',
      threshold: 5,
      duration: 2,
      condition: '> 5% 持续2分钟',
      severity: 'critical',
      notifyChannels: ['email', 'sms', 'wechat', 'webhook'],
      enabled: true,
      createdAt: '2024-03-20 09:15:00',
    },
    {
      id: 'rule-004',
      name: '内存使用率告警',
      metric: 'memory_usage',
      operator: 'gt',
      threshold: 80,
      duration: 5,
      condition: '> 80% 持续5分钟',
      severity: 'warning',
      notifyChannels: ['email'],
      enabled: false,
      createdAt: '2024-04-12 16:20:00',
    },
    {
      id: 'rule-005',
      name: 'QPS过高',
      metric: 'qps',
      operator: 'gt',
      threshold: 1000,
      duration: 1,
      condition: '> 1000 持续1分钟',
      severity: 'info',
      notifyChannels: ['email'],
      enabled: true,
      createdAt: '2024-05-08 11:45:00',
    },
  ]

  const mockAlerts: Alert[] = [
    {
      id: 'alert-001',
      ruleId: 'rule-001',
      ruleName: 'GPU利用率过高',
      severity: 'critical',
      serviceName: 'qwen-chat-api',
      message: 'GPU利用率达到 89%，超过阈值 85%，已持续 6 分钟',
      timestamp: '2024-06-20 14:30:25',
      status: 'active',
    },
    {
      id: 'alert-002',
      ruleId: 'rule-002',
      ruleName: '请求延迟告警',
      severity: 'warning',
      serviceName: 'deepseek-inference',
      message: '平均请求延迟达到 3245ms，超过阈值 3000ms',
      timestamp: '2024-06-20 13:15:18',
      status: 'resolved',
    },
    {
      id: 'alert-003',
      ruleId: 'rule-003',
      ruleName: '错误率异常',
      severity: 'critical',
      serviceName: 'glm-service',
      message: '错误率达到 7.2%，超过阈值 5%',
      timestamp: '2024-06-20 12:05:42',
      status: 'resolved',
    },
    {
      id: 'alert-004',
      ruleId: 'rule-005',
      ruleName: 'QPS过高',
      severity: 'info',
      serviceName: 'qwen-chat-api',
      message: 'QPS达到 1250，超过阈值 1000',
      timestamp: '2024-06-20 11:30:10',
      status: 'active',
    },
  ]

  alertRules.value = mockRules
  alerts.value = mockAlerts
  setStorage(RULES_STORAGE_KEY, mockRules)
  setStorage(ALERTS_STORAGE_KEY, mockAlerts)
}

// 加载数据
const loadData = () => {
  const savedRules = getStorage(RULES_STORAGE_KEY)
  const savedAlerts = getStorage(ALERTS_STORAGE_KEY)

  if (savedRules && Array.isArray(savedRules) && savedRules.length > 0) {
    alertRules.value = savedRules
    alerts.value = savedAlerts || []
  } else {
    initMockData()
  }
}

// 过滤规则
const filteredRules = computed(() => {
  let result = alertRules.value

  if (ruleSearchForm.value.name) {
    result = result.filter((rule) =>
      rule.name.toLowerCase().includes(ruleSearchForm.value.name.toLowerCase())
    )
  }

  if (ruleSearchForm.value.severity) {
    result = result.filter((rule) => rule.severity === ruleSearchForm.value.severity)
  }

  if (ruleSearchForm.value.enabled !== '') {
    const enabled = ruleSearchForm.value.enabled === 'true'
    result = result.filter((rule) => rule.enabled === enabled)
  }

  return result
})

// 规则操作
const handleSearchRule = () => {
  // 搜索已通过computed自动完成
}

const handleResetRule = () => {
  ruleSearchForm.value = {
    name: '',
    severity: '',
    enabled: '',
  }
}

const handleCreateRule = () => {
  ruleDialogMode.value = 'create'
  ruleDialogVisible.value = true
}

const handleEditRule = (row: AlertRule) => {
  ruleDialogMode.value = 'edit'
  ruleFormData.value = {
    id: row.id,
    name: row.name,
    metric: row.metric,
    operator: row.operator,
    threshold: row.threshold,
    duration: row.duration,
    severity: row.severity,
    notifyChannels: [...row.notifyChannels],
    enabled: row.enabled,
  }
  ruleDialogVisible.value = true
}

const handleDeleteRule = (row: AlertRule) => {
  ElMessageBox.confirm(`确定要删除告警规则"${row.name}"吗? 此操作不可恢复。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error',
  }).then(() => {
    const index = alertRules.value.findIndex((r) => r.id === row.id)
    if (index > -1) {
      alertRules.value.splice(index, 1)
      setStorage(RULES_STORAGE_KEY, alertRules.value)
      ElMessage.success('删除成功')
    }
  })
}

const handleToggleRuleStatus = (row: AlertRule) => {
  setStorage(RULES_STORAGE_KEY, alertRules.value)
  ElMessage.success(row.enabled ? '规则已启用' : '规则已禁用')
}

const handleSubmitRule = async () => {
  await ruleFormRef.value.validate()

  const operatorSymbols: Record<string, string> = {
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    eq: '==',
  }

  const condition = `${operatorSymbols[ruleFormData.value.operator]} ${ruleFormData.value.threshold}${
    ruleFormData.value.metric.includes('rate') || ruleFormData.value.metric.includes('utilization') ? '%' : ''
  } 持续${ruleFormData.value.duration}分钟`

  if (ruleDialogMode.value === 'create') {
    const newRule: AlertRule = {
      ...ruleFormData.value,
      id: `rule-${Date.now()}`,
      condition,
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    alertRules.value.unshift(newRule)
    ElMessage.success('创建成功')
  } else {
    const index = alertRules.value.findIndex((r) => r.id === ruleFormData.value.id)
    if (index > -1) {
      alertRules.value[index] = { ...alertRules.value[index], ...ruleFormData.value, condition }
      ElMessage.success('更新成功')
    }
  }

  setStorage(RULES_STORAGE_KEY, alertRules.value)
  ruleDialogVisible.value = false
}

const handleRuleDialogClose = () => {
  ruleFormRef.value?.resetFields()
  ruleFormData.value = {
    id: '',
    name: '',
    metric: '',
    operator: 'gt',
    threshold: 80,
    duration: 5,
    severity: 'warning',
    notifyChannels: [],
    enabled: true,
  }
}

// 告警操作
const handleRefreshAlerts = () => {
  loadData()
  ElMessage.success('数据已刷新')
}

const handleResolveAlert = (alert: Alert) => {
  alert.status = 'resolved'
  setStorage(ALERTS_STORAGE_KEY, alerts.value)
  ElMessage.success('告警已标记为已解决')
}

// 工具函数
const getMetricName = (metric: string) => {
  const names: Record<string, string> = {
    gpu_utilization: 'GPU利用率',
    memory_usage: '内存使用率',
    request_latency: '请求延迟',
    error_rate: '错误率',
    qps: 'QPS',
    pod_status: 'Pod状态',
  }
  return names[metric] || metric
}

const getSeverityName = (severity: string) => {
  const names: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    info: '信息',
  }
  return names[severity] || severity
}

const getSeverityTag = (severity: string) => {
  const tags: Record<string, any> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info',
  }
  return tags[severity] || ''
}

const getSeverityTimelineType = (severity: string) => {
  const types: Record<string, any> = {
    critical: 'danger',
    warning: 'warning',
    info: 'primary',
  }
  return types[severity] || 'primary'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.alert-management-page {
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

  .alert-item {
    .alert-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .alert-title {
        font-weight: 600;
        font-size: 14px;
      }
    }

    .alert-content {
      font-size: 13px;
      color: #606266;
      margin-bottom: 8px;
    }

    .alert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;

      .alert-service {
        color: #909399;
      }
    }
  }

  .empty-state {
    padding: 20px 0;
  }
}
</style>
