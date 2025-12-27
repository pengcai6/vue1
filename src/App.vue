<script setup lang="ts">
import BaseHeader from '~/components/layouts/BaseHeader.vue'
import BaseSide from '~/components/layouts/BaseSide.vue'
</script>

<template>
  <el-config-provider namespace="ep">
    <el-container style="height: 100vh">
      <el-header style="padding: 0">
        <BaseHeader />
      </el-header>
      <el-container style="overflow: hidden">
        <el-aside width="auto">
          <BaseSide />
        </el-aside>
        <el-main style="padding: 0">
          <RouterView />
        </el-main>
      </el-container>
    </el-container>
  </el-config-provider>
</template>

<style>
#app {
  color: var(--ep-text-color-primary);
}
</style>
