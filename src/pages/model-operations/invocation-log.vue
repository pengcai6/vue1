<template>
  <div class="invocation-log-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">API调用日志</span>
          <div>
            <el-button type="primary" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出日志
            </el-button>
            <el-button type="success" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="服务名称">
          <el-select
            v-model="searchForm.serviceName"
            placeholder="请选择服务"
            clearable
            style="width: 180px"
          >
            <el-option label="全部" value="" />
            <el-option label="qwen-chat-api" value="qwen-chat-api" />
            <el-option label="deepseek-inference" value="deepseek-inference" />
            <el-option label="glm-service" value="glm-service" />
          </el-select>
        </el-form-item>
        <el-form-item label="API端点">
          <el-input
            v-model="searchForm.endpoint"
            placeholder="请输入API端点"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="状态码">
          <el-select
            v-model="searchForm.statusCode"
            placeholder="请选择状态码"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="200" value="200" />
            <el-option label="400" value="400" />
            <el-option label="401" value="401" />
            <el-option label="500" value="500" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Key">
          <el-input
            v-model="searchForm.apiKey"
            placeholder="请输入API Key"
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

      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="总调用次数" :value="statistics.totalCalls">
              <template #suffix>次</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="成功率" :value="statistics.successRate" :precision="2">
              <template #suffix>%</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="平均延迟" :value="statistics.avgLatency">
              <template #suffix>ms</template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="总Token消耗" :value="statistics.totalTokens">
              <template #suffix>tokens</template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 调用日志列表 -->
      <el-table :data="paginatedLogs" border style="width: 100%">
        <el-table-column prop="id" label="请求ID" width="160" show-overflow-tooltip />
        <el-table-column prop="serviceName" label="服务名称" width="150" />
        <el-table-column prop="endpoint" label="API端点" width="180" show-overflow-tooltip />
        <el-table-column prop="method" label="方法" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.method === 'POST' ? 'primary' : 'success'" size="small">
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="statusCode" label="状态码" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusCodeTag(row.statusCode)">
              {{ row.statusCode }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="apiKey" label="API Key" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ maskApiKey(row.apiKey) }}
          </template>
        </el-table-column>
        <el-table-column prop="latency" label="延迟(ms)" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: getLatencyColor(row.latency) }">{{ row.latency }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="ttft" label="TTFT(ms)" width="100" align="center" />
        <el-table-column prop="tps" label="TPS" width="80" align="center" />
        <el-table-column prop="organization" label="组织" width="120" show-overflow-tooltip />
        <el-table-column prop="inputTokens" label="输入tokens" width="110" align="center" />
        <el-table-column prop="outputTokens" label="输出tokens" width="110" align="center" />
        <el-table-column prop="totalTokens" label="总tokens" width="100" align="center" />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="timestamp" label="请求时间" width="180" />
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

    <!-- 调用详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="调用详情" width="900px">
      <el-descriptions :column="2" border v-if="selectedLog">
        <el-descriptions-item label="请求ID" :span="2">{{ selectedLog.id }}</el-descriptions-item>
        <el-descriptions-item label="服务名称">{{ selectedLog.serviceName }}</el-descriptions-item>
        <el-descriptions-item label="API端点">{{ selectedLog.endpoint }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">
          <el-tag :type="selectedLog.method === 'POST' ? 'primary' : 'success'">
            {{ selectedLog.method }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态码">
          <el-tag :type="getStatusCodeTag(selectedLog.statusCode)">
            {{ selectedLog.statusCode }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="API Key">{{ selectedLog.apiKey }}</el-descriptions-item>
        <el-descriptions-item label="用户标识">{{ selectedLog.userId }}</el-descriptions-item>
        <el-descriptions-item label="请求延迟">{{ selectedLog.latency }}ms</el-descriptions-item>
        <el-descriptions-item label="TTFT">{{ selectedLog.ttft }}ms</el-descriptions-item>
        <el-descriptions-item label="TPS">{{ selectedLog.tps }}</el-descriptions-item>
        <el-descriptions-item label="组织">{{ selectedLog.organization }}</el-descriptions-item>
        <el-descriptions-item label="模型名称">{{ selectedLog.modelName }}</el-descriptions-item>
        <el-descriptions-item label="输入tokens">{{
          selectedLog.inputTokens
        }}</el-descriptions-item>
        <el-descriptions-item label="输出tokens">{{
          selectedLog.outputTokens
        }}</el-descriptions-item>
        <el-descriptions-item label="总tokens">{{ selectedLog.totalTokens }}</el-descriptions-item>
        <el-descriptions-item label="费用估算"
          >¥{{ selectedLog.estimatedCost }}</el-descriptions-item
        >
        <el-descriptions-item label="IP地址">{{ selectedLog.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="地理位置">{{ selectedLog.location }}</el-descriptions-item>
        <el-descriptions-item label="请求时间" :span="2">{{
          selectedLog.timestamp
        }}</el-descriptions-item>
        <el-descriptions-item label="请求体" :span="2">
          <el-input
            v-model="selectedLog.requestBody"
            type="textarea"
            :rows="6"
            readonly
            style="font-family: monospace; font-size: 12px"
          />
        </el-descriptions-item>
        <el-descriptions-item label="响应体" :span="2">
          <el-input
            v-model="selectedLog.responseBody"
            type="textarea"
            :rows="6"
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
import { Download, Refresh } from '@element-plus/icons-vue'

interface InvocationLog {
  id: string
  serviceName: string
  endpoint: string
  method: string
  statusCode: number
  apiKey: string
  userId: string
  latency: number
  ttft: number
  tps: number
  organization: string
  modelName: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: string
  ipAddress: string
  location: string
  timestamp: string
  requestBody: string
  responseBody: string
}

const STORAGE_KEY = 'invocation_logs_data'

// 搜索表单
const searchForm = ref({
  serviceName: '',
  endpoint: '',
  statusCode: '',
  apiKey: '',
  dateRange: [] as any[],
})

// 调用日志列表
const invocationLogs = ref<InvocationLog[]>([])

// 统计数据
const statistics = computed(() => {
  const logs = filteredLogs.value
  const totalCalls = logs.length
  const successCalls = logs.filter((log) => log.statusCode === 200).length
  const successRate = totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0
  const avgLatency =
    totalCalls > 0 ? logs.reduce((sum, log) => sum + log.latency, 0) / totalCalls : 0
  const totalTokens = logs.reduce((sum, log) => sum + log.totalTokens, 0)

  return {
    totalCalls,
    successRate,
    avgLatency: Math.round(avgLatency),
    totalTokens,
  }
})

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 详情对话框
const detailDialogVisible = ref(false)
const selectedLog = ref<InvocationLog | null>(null)

// 初始化模拟数据
const initMockData = () => {
  const mockLogs: InvocationLog[] = [
    {
      id: 'req-1719123456789-abc123',
      serviceName: 'qwen-chat-api',
      endpoint: '/v1/chat/completions',
      method: 'POST',
      statusCode: 200,
      apiKey: 'sk-1234567890abcdef1234567890abcdef',
      userId: 'user-001',
      latency: 1234,
      ttft: 150,
      tps: 45,
      organization: '研发部',
      modelName: 'Qwen2.5-72B-Instruct',
      inputTokens: 156,
      outputTokens: 423,
      totalTokens: 579,
      estimatedCost: '0.0289',
      ipAddress: '192.168.1.100',
      location: '北京市 朝阳区',
      timestamp: '2024-06-20 10:30:45',
      requestBody: JSON.stringify(
        {
          model: 'Qwen2.5-72B-Instruct',
          messages: [{ role: 'user', content: '请介绍一下人工智能的发展历程' }],
          temperature: 0.7,
          max_tokens: 500,
        },
        null,
        2,
      ),
      responseBody: JSON.stringify(
        {
          id: 'chatcmpl-abc123',
          choices: [
            {
              message: {
                role: 'assistant',
                content: '人工智能的发展历程可以追溯到20世纪50年代...',
              },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 156, completion_tokens: 423, total_tokens: 579 },
        },
        null,
        2,
      ),
    },
    {
      id: 'req-1719123460123-def456',
      serviceName: 'deepseek-inference',
      endpoint: '/v1/chat/completions',
      method: 'POST',
      statusCode: 200,
      apiKey: 'sk-abcdefgh1234567890abcdefgh123456',
      userId: 'user-002',
      latency: 2156,
      ttft: 200,
      tps: 52,
      organization: '市场部',
      modelName: 'DeepSeek-V3',
      inputTokens: 234,
      outputTokens: 678,
      totalTokens: 912,
      estimatedCost: '0.0456',
      ipAddress: '192.168.1.105',
      location: '上海市 浦东新区',
      timestamp: '2024-06-20 11:15:20',
      requestBody: JSON.stringify(
        {
          model: 'DeepSeek-V3',
          messages: [{ role: 'user', content: '如何优化大模型推理性能？' }],
          temperature: 0.8,
        },
        null,
        2,
      ),
      responseBody: JSON.stringify(
        {
          id: 'chatcmpl-def456',
          choices: [
            {
              message: {
                role: 'assistant',
                content: '优化大模型推理性能可以从以下几个方面入手...',
              },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 234, completion_tokens: 678, total_tokens: 912 },
        },
        null,
        2,
      ),
    },
    {
      id: 'req-1719123465789-ghi789',
      serviceName: 'qwen-chat-api',
      endpoint: '/v1/chat/completions',
      method: 'POST',
      statusCode: 401,
      apiKey: 'sk-invalid-key-12345',
      userId: 'unknown',
      latency: 45,
      ttft: 0,
      tps: 0,
      organization: '未知',
      modelName: '',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: '0.00',
      ipAddress: '203.0.113.50',
      location: '未知地区',
      timestamp: '2024-06-20 12:05:15',
      requestBody: JSON.stringify(
        {
          model: 'Qwen2.5-72B-Instruct',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        null,
        2,
      ),
      responseBody: JSON.stringify(
        { error: { message: 'Invalid API key', type: 'invalid_request_error' } },
        null,
        2,
      ),
    },
    {
      id: 'req-1719123470234-jkl012',
      serviceName: 'glm-service',
      endpoint: '/v1/chat/completions',
      method: 'POST',
      statusCode: 200,
      apiKey: 'sk-glm-key-xyz987654321',
      userId: 'user-003',
      latency: 1567,
      ttft: 180,
      tps: 48,
      organization: '产品部',
      modelName: 'GLM-4-Plus',
      inputTokens: 189,
      outputTokens: 512,
      totalTokens: 701,
      estimatedCost: '0.0351',
      ipAddress: '192.168.1.110',
      location: '深圳市 南山区',
      timestamp: '2024-06-20 13:20:30',
      requestBody: JSON.stringify(
        {
          model: 'GLM-4-Plus',
          messages: [{ role: 'user', content: '请写一段Python代码实现快速排序' }],
          temperature: 0.5,
        },
        null,
        2,
      ),
      responseBody: JSON.stringify(
        {
          id: 'chatcmpl-jkl012',
          choices: [
            {
              message: {
                role: 'assistant',
                content:
                  '以下是Python实现的快速排序代码：\n```python\ndef quicksort(arr):\n    ...',
              },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 189, completion_tokens: 512, total_tokens: 701 },
        },
        null,
        2,
      ),
    },
    {
      id: 'req-1719123475678-mno345',
      serviceName: 'qwen-chat-api',
      endpoint: '/v1/chat/completions',
      method: 'POST',
      statusCode: 500,
      apiKey: 'sk-1234567890abcdef1234567890abcdef',
      userId: 'user-001',
      latency: 5023,
      ttft: 0,
      tps: 0,
      organization: '研发部',
      modelName: 'Qwen2.5-72B-Instruct',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: '0.00',
      ipAddress: '192.168.1.100',
      location: '北京市 朝阳区',
      timestamp: '2024-06-20 14:10:50',
      requestBody: JSON.stringify(
        {
          model: 'Qwen2.5-72B-Instruct',
          messages: [{ role: 'user', content: '测试请求' }],
        },
        null,
        2,
      ),
      responseBody: JSON.stringify(
        { error: { message: 'Internal server error', type: 'server_error' } },
        null,
        2,
      ),
    },
  ]

  invocationLogs.value = mockLogs
}

// 加载数据
const loadData = () => {
  initMockData()
}

// 过滤后的日志列表
const filteredLogs = computed(() => {
  let result = invocationLogs.value

  if (searchForm.value.serviceName) {
    result = result.filter((log) => log.serviceName === searchForm.value.serviceName)
  }

  if (searchForm.value.endpoint) {
    result = result.filter((log) => log.endpoint.includes(searchForm.value.endpoint))
  }

  if (searchForm.value.statusCode) {
    result = result.filter((log) => log.statusCode === Number(searchForm.value.statusCode))
  }

  if (searchForm.value.apiKey) {
    result = result.filter((log) => log.apiKey.includes(searchForm.value.apiKey))
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
    serviceName: '',
    endpoint: '',
    statusCode: '',
    apiKey: '',
    dateRange: [],
  }
  currentPage.value = 1
}

// 刷新
const handleRefresh = () => {
  loadData()
  ElMessage.success('数据已刷新')
}

// 查看详情
const handleViewDetail = (row: InvocationLog) => {
  selectedLog.value = row
  detailDialogVisible.value = true
}

// 导出日志
const handleExport = () => {
  const headers = [
    '日志ID',
    '服务名称',
    'API端点',
    '状态码',
    '耗时(ms)',
    'TTFT(ms)',
    'TPS',
    '组织',
    'API Key',
    'IP地址',
    '模型',
    '总Token',
    '费用($)',
    '调用时间',
  ]
  const rows = filteredLogs.value.map((log) => [
    log.id,
    log.serviceName,
    log.endpoint,
    log.statusCode,
    log.latency,
    log.ttft,
    log.tps,
    log.organization,
    log.apiKey,
    log.ipAddress,
    log.modelName,
    log.totalTokens,
    log.estimatedCost,
    log.timestamp,
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `invocation-logs-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('日志导出成功')
}

// 工具函数
const maskApiKey = (apiKey: string) => {
  if (apiKey.length <= 8) return apiKey
  return apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
}

const getStatusCodeTag = (code: number) => {
  if (code >= 200 && code < 300) return 'success'
  if (code >= 400 && code < 500) return 'warning'
  if (code >= 500) return 'danger'
  return 'info'
}

const getLatencyColor = (latency: number) => {
  if (latency < 1000) return '#67c23a'
  if (latency < 3000) return '#e6a23c'
  return '#f56c6c'
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
.invocation-log-page {
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
