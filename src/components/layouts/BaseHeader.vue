<script lang="ts" setup>
import { toggleDark } from '~/composables'
import { Cpu, UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const handleLogout = () => {
  ElMessage.success('退出登录成功')
}
</script>

<template>
  <el-menu class="el-menu-demo" mode="horizontal" :ellipsis="false" router>
    <el-menu-item index="/">
      <div class="flex items-center justify-center gap-2">
        <el-icon :size="24" class="mr-2">
          <Cpu />
        </el-icon>
        <span class="text-lg font-bold">大模型服务平台</span>
      </div>
    </el-menu-item>

    <el-menu-item class="h-full" @click="toggleDark()">
      <button
        class="w-full cursor-pointer border-none bg-transparent"
        style="height: var(--ep-menu-item-height)"
      >
        <i inline-flex i="dark:ep-moon ep-sunny" />
      </button>
    </el-menu-item>

    <el-sub-menu index="user">
      <template #title>
        <div class="flex items-center gap-2">
          <el-avatar :size="32" :icon="UserFilled" />
          <span>Admin</span>
        </div>
      </template>
      <el-menu-item index="logout" @click="handleLogout">退出登录</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<style lang="scss">
.el-menu-demo {
  &.ep-menu--horizontal > .ep-menu-item:nth-child(1) {
    margin-right: auto;
  }
}
</style>
