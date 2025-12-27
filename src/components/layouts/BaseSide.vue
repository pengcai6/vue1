<script lang="ts" setup>
import {
  Cpu,
  Grid,
  Edit,
  Upload,
  MagicStick,
  Folder,
  Setting,
  TrendCharts,
} from '@element-plus/icons-vue'

function handleOpen(key: string, keyPath: string[]) {
  console.log('[大模型服务平台]', key, keyPath)
}
function handleClose(key: string, keyPath: string[]) {
  console.log('[大模型服务平台]', key, keyPath)
}
</script>

<template>
  <el-menu
    router
    default-active="/"
    class="el-menu-vertical-demo"
    @open="handleOpen"
    @close="handleClose"
  >
    <!-- 1. 大模型推理智能调度 -->
    <el-sub-menu index="inference-scheduling">
      <template #title>
        <el-icon>
          <Cpu />
        </el-icon>
        <span>推理智能调度</span>
      </template>
      <el-menu-item index="/inference-scheduling/resource-pool">
        资源池（异构加速器）
      </el-menu-item>
      <el-menu-item index="/inference-scheduling/intelligent-scheduling"> 智能调度 </el-menu-item>
      <el-menu-item index="/inference-scheduling/auto-scaling"> 弹性扩缩容 </el-menu-item>
    </el-sub-menu>

    <!-- 2. 模型广场 -->
    <el-sub-menu index="model-marketplace">
      <template #title>
        <el-icon>
          <Grid />
        </el-icon>
        <span>模型广场</span>
      </template>
      <el-menu-item index="/model-marketplace/model-list"> 模型列表 </el-menu-item>
    </el-sub-menu>

    <!-- 3. 模型微调 -->
    <el-sub-menu index="model-finetune">
      <template #title>
        <el-icon>
          <Edit />
        </el-icon>
        <span>模型微调</span>
      </template>
      <el-menu-item index="/model-finetune/task-list"> 微调任务列表 </el-menu-item>
    </el-sub-menu>

    <!-- 4. 模型部署 -->
    <el-sub-menu index="model-deployment">
      <template #title>
        <el-icon>
          <Upload />
        </el-icon>
        <span>模型部署</span>
      </template>
      <el-menu-item index="/model-deployment/service-list"> 模型服务列表 </el-menu-item>
    </el-sub-menu>

    <!-- 5. 模型测评 -->
    <el-sub-menu index="model-evaluation">
      <template #title>
        <el-icon>
          <MagicStick />
        </el-icon>
        <span>模型测评</span>
      </template>
      <el-menu-item index="/model-evaluation/task-list"> 测评任务列表 </el-menu-item>
    </el-sub-menu>

    <!-- 6. 数据集管理 -->
    <el-sub-menu index="dataset-management">
      <template #title>
        <el-icon>
          <Folder />
        </el-icon>
        <span>数据集管理</span>
      </template>
      <el-menu-item index="/dataset-management/dataset-list"> 数据集列表 </el-menu-item>
    </el-sub-menu>

    <!-- 7. 模型运营管理 -->
    <el-sub-menu index="model-operations">
      <template #title>
        <el-icon>
          <Setting />
        </el-icon>
        <span>模型运营管理</span>
      </template>
      <el-menu-item index="/model-operations/organization-management"> 组织管理 </el-menu-item>
      <el-menu-item index="/model-operations/user-role"> 用户与角色（RBAC） </el-menu-item>
      <el-menu-item index="/model-operations/resource-permission"> 资源权限管控 </el-menu-item>
      <el-menu-item index="/model-operations/audit-log"> 审计日志 </el-menu-item>
      <el-menu-item index="/model-operations/invocation-log"> 调用日志 </el-menu-item>
      <el-menu-item index="/model-operations/alert-management"> 告警管理 </el-menu-item>
    </el-sub-menu>

    <!-- 8. 模型服务监控 -->
    <el-sub-menu index="service-monitoring">
      <template #title>
        <el-icon>
          <TrendCharts />
        </el-icon>
        <span>模型服务监控</span>
      </template>
      <el-menu-item index="/service-monitoring/operational-report"> 运营报告 </el-menu-item>
      <el-menu-item index="/service-monitoring/service-monitoring"> 服务监控 </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<style lang="scss" scoped>
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 240px;
  min-height: 100%;
}
</style>
