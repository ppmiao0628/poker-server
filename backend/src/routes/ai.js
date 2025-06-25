/*
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-04-30 10:00:00
 * @LastEditors: ppm 
 * @LastEditTime: 2025-06-13 16:39:19
 * @Description: AI对话路由
 */
const Router = require('koa-router');
const WebSocket = require('ws');
const crypto = require('crypto');
const router = new Router();

const MODEL = {
  X1: {
    domain: 'x1',
    hasThink: true,
    path: '/v1/x1'
  },
  LITE: {
    domain: 'lite',
    hasThink: false,
    path: '/v1.1/chat'
  }
}
const MODEL_NAME = 'LITE';
// 讯飞星火API配置 wss://spark-api.xf-yun.com/v1/x1
// 讯飞星火lite API配置 wss://spark-api.xf-yun.com/v1.1/chat
const XFYUN_APP_ID = process.env.XFYUN_APP_ID;
const XFYUN_API_KEY = process.env.XFYUN_API_KEY;
const XFYUN_API_SECRET = process.env.XFYUN_API_SECRET;
const XFYUN_HOST = 'spark-api.xf-yun.com';
const XFYUN_PATH = MODEL[MODEL_NAME].path;

// 验证必要的API配置
if (!XFYUN_APP_ID || !XFYUN_API_KEY || !XFYUN_API_SECRET) {
  console.error('请配置讯飞星火API的必要参数：XFYUN_APP_ID, XFYUN_API_KEY, XFYUN_API_SECRET');
}

// 生成鉴权信息的工具函数
function getAuthUrl() {
  const dateString = new Date().toGMTString();
  
  // 生成签名字符串（注意：不能缩进，必须严格按照格式）
  const signatureOrigin = `host: ${XFYUN_HOST}\ndate: ${dateString}\nGET ${XFYUN_PATH} HTTP/1.1`;
  
  // 生成签名
  const signature = crypto.createHmac('sha256', XFYUN_API_SECRET)
    .update(signatureOrigin)
    .digest('base64');
  
  // 组装authorization_origin
  const authorizationOrigin = `api_key="${XFYUN_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  
  // 生成authorization
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  
  // 构建URL（注意：date参数需要URL编码）
  const url = `wss://${XFYUN_HOST}${XFYUN_PATH}?authorization=${authorization}&date=${encodeURIComponent(dateString)}&host=${XFYUN_HOST}`;
  
  return url;
}

// AI对话接口
router.post('/chat', async (ctx) => {
  try {
    const { messages } = ctx.request.body;

    // 验证消息格式
    if (!Array.isArray(messages) || messages.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid messages format' };
      return;
    }

    // 确保每条消息都有正确的格式
    const formattedMessages = messages.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

    // 设置SSE响应头
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'  // 禁用 Nginx 缓冲
    });
    ctx.status = 200;
    ctx.res.flushHeaders();

    // 创建WebSocket连接
    const wsUrl = getAuthUrl();
    const ws = new WebSocket(wsUrl);

    // 构建请求数据
    const requestData = {
      header: {
        app_id: XFYUN_APP_ID,
        uid: "12345"
      },
      parameter: {
        chat: {
          domain: MODEL[MODEL_NAME].domain,
          temperature: 0.5,
          max_tokens: 2048
        }
      },
      payload: {
        message: {
          text: formattedMessages
            .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && msg.content))
            .map(msg => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content
            }))
        }
      }
    };

    // 处理WebSocket连接
    ws.on('open', () => {
      ws.send(JSON.stringify(requestData));
    });

    // 创建一个Promise来处理WebSocket响应
    const responsePromise = new Promise((resolve, reject) => {
      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data);
          console.log(JSON.stringify(response.payload));
          
          if (response.header && response.header.code !== 0) {
            throw new Error(response.header.message || 'API error');
          }
          
          // 处理返回的消息内容
          if (response.payload && response.payload.choices && response.payload.choices.text) {
            const text = response.payload.choices.text[0];
            const isThinking = MODEL[MODEL_NAME].hasThink && response.payload.choices.status === 1;
            const content = text.content || text.reasoning_content || '';
            
            if (content) {
              // 构造返回数据
              const responseData = {
                type: isThinking ? 'thinking' : 'response',
                content: content,
                status: response.payload.choices.status
              };
              
              // 将数据转换为SSE格式并发送
              const sseData = `data: ${JSON.stringify(responseData)}\n\n`;
              ctx.res.write(sseData);
              
              // 如果是最终响应，标记完成
              if (response.payload.choices.status === 2) {
                resolve();
              }
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          reject(error);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      ws.on('close', () => {
        resolve();
      });
    });

    // 等待WebSocket响应完成
    await responsePromise;
    
    // 确保响应结束
    ctx.res.end();

  } catch (error) {
    // console.error('API error:', error);
    // 如果响应头已经发送，使用SSE格式发送错误
    if (ctx.res.headersSent) {
      ctx.res.write(`data: ${JSON.stringify({
        type: 'error',
        content: error.message
      })}\n\n`);
      ctx.res.end();
    } else {
      ctx.status = 500;
      ctx.body = { error: 'Internal Server Error' };
    }
  }
});

// 演示用的长文本数据
const DEMO_TEXT = `这是一段用于演示流式传输效果的长文本数据。它将模拟AI生成文本的过程，逐字逐句地返回给前端。

在实际应用中，AI模型会根据用户的输入实时生成响应。这个过程可能需要几秒到几十秒不等，具体取决于输入的复杂度和模型的处理速度。

通过流式传输，我们可以让用户尽快看到初始的响应，提升用户体验。这种方式特别适合处理长文本生成的场景，比如：
- 文章生成
- 代码解释
- 故事创作
- 技术文档编写

流式传输的优势在于：
1. 即时反馈
2. 更好的交互体验
3. 降低用户等待焦虑
4. 适合长文本处理

这个演示接口将会模拟这个过程，让开发者更好地理解和实现类似功能。`;

// 演示接口：流式返回长文本
router.post('/chat-demo', async (ctx) => {
  try {
    // 设置SSE响应头
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    ctx.status = 200;
    ctx.res.flushHeaders();

    // 模拟流式传输过程
    const words = DEMO_TEXT.split('');
    for (const word of words) {
      ctx.res.write(word);
      // 添加随机延迟，模拟真实的生成过程
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    }

    ctx.res.end();
  } catch (error) {
    console.error('Demo API error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

module.exports = router;