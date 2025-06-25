<template>
  <div class="ai-chat">
    <div class="chat-container">
      <div class="chat-messages" ref="messagesContainer">
        <div v-for="(message, index) in messages" :key="index" class="message">
          <div class="message-content" :class="message.role">
            <template v-if="message.role === 'assistant'">
              <div v-if="message.thinking" class="thinking-content">
                <div class="thinking-header">思考过程：</div>
                <div class="thinking-text">{{ message.thinking }}</div>
              </div>
              <div class="response-content">{{ message.content }}</div>
            </template>
            <template v-else>
              {{ message.content }}
            </template>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <el-input
          v-model="userInput"
          type="textarea"
          :rows="3"
          placeholder="请输入您的问题"
          :disabled="isLoading"
          @keyup.enter.ctrl="sendMessage"
        ></el-input>
        <div class="input-actions">
          <span class="hint">按 Ctrl + Enter 发送</span>
          <div>
            <el-button 
              type="primary" 
              @click="chatDemo" 
              :loading="isLoading"
              :disabled="!userInput.trim()"
            >demo</el-button>
            <el-button
              type="primary" 
              @click="sendMessage" 
              :loading="isLoading"
              :disabled="!userInput.trim()"
            >发送</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const userInput = ref('')
const messages = ref([])
const isLoading = ref(false)
const messagesContainer = ref(null)

const chatDemo = async () => {
  const input = userInput.value.trim()
  if (!input || isLoading.value) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: input
  })

  // 清空输入框
  userInput.value = ''

  // 添加AI消息占位
  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: ''
  })

  // 滚动到底部
  await scrollToBottom()

  try {
    isLoading.value = true

    // 创建响应流
    const response = await fetch('/poker/api/ai/chat-demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages.value.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    // 读取流数据
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // 解码并追加内容
      const text = decoder.decode(value)
      messages.value[aiMessageIndex].content += text

      // 滚动到底部
      await scrollToBottom()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送失败，请重试')
    // 移除失败的消息
    messages.value.splice(aiMessageIndex, 1)
  } finally {
    isLoading.value = false
  }
}
// 发送消息
const sendMessage = async () => {
  const input = userInput.value.trim()
  if (!input || isLoading.value) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: input
  })

  // 清空输入框
  userInput.value = ''

  // 添加AI消息占位
  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    thinking: ''
  })

  // 滚动到底部
  await scrollToBottom()

  try {
    isLoading.value = true

    // 创建响应流
    const response = await fetch('/poker/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        messages: messages.value.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    })

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // 读取流数据
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解码并处理数据
      const text = decoder.decode(value);
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'thinking') {
              messages.value[aiMessageIndex].thinking += data.content;
            } else if (data.type === 'response') {
              messages.value[aiMessageIndex].content += data.content;
            } else if (data.type === 'error') {
              throw new Error(data.content);
            }
          } catch (error) {
            console.error('解析响应数据失败:', error);
          }
        }
      }

      // 滚动到底部
      await scrollToBottom();
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    ElMessage.error('发送失败，请重试');
    // 移除失败的消息
    messages.value.splice(aiMessageIndex, 1);
  } finally {
    isLoading.value = false;
  }
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}
</script>

<style scoped>
.ai-chat {
  padding: 20px;
}

.chat-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 20px;
}

.message-content {
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 80%;
  word-break: break-word;
  white-space: pre-wrap;
}

.message-content.user {
  background-color: #e6f7ff;
  margin-left: auto;
}

.message-content.assistant {
  background-color: #f5f5f5;
}

.thinking-content {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9em;
  color: #666;
}

.thinking-header {
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
}

.thinking-text {
  white-space: pre-wrap;
}

.response-content {
  margin-top: 8px;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #eee;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.hint {
  color: #999;
  font-size: 12px;
}
</style>