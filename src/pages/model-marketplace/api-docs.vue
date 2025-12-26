<template>
  <div class="api-docs-page">
    <el-card>
      <h2 class="text-2xl font-bold mb-4">
        API文档
      </h2>

      <el-alert type="info" :closable="false" class="mb-4">
        <p>本页面提供模型服务API的详细使用文档和示例代码</p>
      </el-alert>

      <el-tabs>
        <el-tab-pane label="快速开始" name="quickstart">
          <h3 class="font-bold mb-3">获取API Key</h3>
          <p class="mb-3">在调用API之前，请先在用户中心获取您的API Key</p>

          <h3 class="font-bold mb-3 mt-4">认证方式</h3>
          <p class="mb-2">在HTTP请求头中添加Authorization字段：</p>
          <pre class="code-block">Authorization: Bearer YOUR_API_KEY</pre>

          <h3 class="font-bold mb-3 mt-4">基础URL</h3>
          <pre class="code-block">https://api.example.com/v1</pre>
        </el-tab-pane>

        <el-tab-pane label="Chat Completions" name="chat">
          <h3 class="font-bold mb-3">创建对话补全</h3>
          <p class="mb-3">POST /v1/chat/completions</p>

          <h4 class="font-bold mb-2">请求参数</h4>
          <el-table :data="chatParams" border class="mb-4">
            <el-table-column prop="param" label="参数" width="150" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="required" label="必填" width="80" />
            <el-table-column prop="desc" label="说明" />
          </el-table>

          <h4 class="font-bold mb-2">示例代码</h4>
          <pre class="code-block">{{ chatExample }}</pre>
        </el-tab-pane>

        <el-tab-pane label="Embeddings" name="embeddings">
          <h3 class="font-bold mb-3">创建文本嵌入</h3>
          <p class="mb-3">POST /v1/embeddings</p>

          <h4 class="font-bold mb-2">示例代码</h4>
          <pre class="code-block">{{ embeddingsExample }}</pre>
        </el-tab-pane>

        <el-tab-pane label="Image Generation" name="images">
          <h3 class="font-bold mb-3">图像生成</h3>
          <p class="mb-3">POST /v1/images/generations</p>

          <h4 class="font-bold mb-2">示例代码</h4>
          <pre class="code-block">{{ imagesExample }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const chatParams = ref([
  { param: 'model', type: 'string', required: '是', desc: '模型名称' },
  { param: 'messages', type: 'array', required: '是', desc: '对话消息列表' },
  { param: 'temperature', type: 'number', required: '否', desc: '温度参数，默认0.7' },
  { param: 'max_tokens', type: 'integer', required: '否', desc: '最大生成token数' },
  { param: 'top_p', type: 'number', required: '否', desc: 'Top-p采样参数' },
])

const chatExample = `import requests

url = "https://api.example.com/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "llama-2-7b",
    "messages": [
        {"role": "system", "content": "你是一个有帮助的AI助手"},
        {"role": "user", "content": "介绍一下Python语言"}
    ],
    "temperature": 0.7,
    "max_tokens": 2000
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`

const embeddingsExample = `import requests

url = "https://api.example.com/v1/embeddings"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "bge-large",
    "input": "这是一段需要向量化的文本"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`

const imagesExample = `import requests

url = "https://api.example.com/v1/images/generations"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "stable-diffusion-xl",
    "prompt": "一只可爱的猫咪",
    "size": "1024x1024",
    "n": 1
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`
</script>

<style scoped lang="scss">
.api-docs-page {
  padding: 20px;

  .code-block {
    background: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre;
  }
}
</style>
