// const { io } = require("socket.io-client");

// // 假设你的 NestJS 服务运行在 3000 端口
// const socket = io("http://localhost:3000");

// // 监听连接成功事件
// socket.on("connect", () => {
//   console.log("✅ 已连接到服务端, Socket ID:", socket.id);

//   // 向服务端发送 'events' 消息
//   // 注意第三个参数是一个回调函数，用于接收服务端 return 的结果
//   socket.emit("events", { msg: "你好服务端" }, (response) => {
//     console.log("📢 收到服务端的确认回执:", response);
//     // 预期输出: { event: 'events', data: 'Hello from server!' }
    
//     // 测试完毕，断开连接
//     socket.close();
//     process.exit(0);
//   });
// });

// // 监听连接错误
// socket.on("connect_error", (err) => {
//   console.error("❌ 连接失败:", err.message);
// });



// const { io } = require("socket.io-client");

// const socket = io("http://localhost:3000", {
//   transports: ["websocket"],
//   reconnection: false,
//   timeout: 5000,
// });

// socket.on("connect", () => {
//   console.log("已连接到服务端, Socket ID:", socket.id);
//   socket.emit("events", { msg: "你好服务端" });
// });

// socket.on("events", (data) => {
//   console.log("收到服务端 events:", data);
//   socket.close();
//   process.exit(0);
// });

// socket.on("connect_error", (err) => {
//   console.error("连接失败:", err.message);
// });



// const { io } = require('socket.io-client');

// const DEFAULT_SOCKET_URL = 'http://localhost:3000';
// const DEFAULT_EVENT_NAME = 'events';
// const DEFAULT_TIMEOUT_MS = 5000;

// function normalizeUrl(value) {
//   const text = String(value || '').trim();
//   const markdownLink = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
//   return markdownLink ? markdownLink[2] : text;
// }

// function parseTimeoutMs(value) {
//   const n = Number(value);
//   return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
// }

// const socketUrl = normalizeUrl(process.argv[2] || DEFAULT_SOCKET_URL);
// const eventName = String(process.argv[3] || DEFAULT_EVENT_NAME).trim() || DEFAULT_EVENT_NAME;
// const timeoutMs = parseTimeoutMs(process.argv[4]);

// console.log('准备连接 Socket.IO 服务端:', socketUrl);
// console.log('测试事件名称:', eventName);

// const socket = io(socketUrl, {
//   transports: ['websocket'],
//   reconnection: false,
//   timeout: timeoutMs,
// });

// let finished = false;
// const timeout = setTimeout(() => {
//   finish(1, '测试超时，未收到服务端响应');
// }, timeoutMs + 1000);

// function finish(code, message) {
//   if (finished) return;
//   finished = true;
//   clearTimeout(timeout);
//   if (message) {
//     if (code === 0) {
//       console.log(message);
//     } else {
//       console.error(message);
//     }
//   }
//   try {
//     socket.close();
//   } catch (_) {
//     // ignore close errors in test cleanup
//   }
//   process.exit(code);
// }

// socket.on('connect', () => {
//   console.log('已连接到服务端, Socket ID:', socket.id);
//   socket.emit(eventName, {
//     msg: '你好服务端',
//     at: Date.now(),
//   });
// });

// socket.on(eventName, (data) => {
//   console.log(`收到服务端 ${eventName}:`, data);
//   finish(0, 'Socket.IO 测试完成');
// });

// socket.on('connect_error', (err) => {
//   finish(1, '连接失败: ' + (err && err.message ? err.message : String(err)));
// });

// socket.on('disconnect', (reason) => {
//   if (!finished) {
//     console.log('连接已断开:', reason);
//   }
// });

// process.on('SIGINT', () => {
//   finish(130, '测试已取消');
// });



// client.js
// import { io } from 'socket.io-client';
// const { io } = require('socket.io-client');

// const socket = io('http://localhost:3000', {
//   query: { userId: 'user_123' },
//   // 自动重连配置（默认就是开启的，这里显式写出来便于控制）
//   reconnection: true,              // 断线后自动重连
//   reconnectionAttempts: Infinity,  // 无限重试，永不放弃
//   reconnectionDelay: 1000,         // 首次重连延迟 1 秒
//   reconnectionDelayMax: 10000,     // 重连延迟上限 10 秒（指数退避）
//   randomizationFactor: 0.5,        // 延迟随机化因子，防止雪崩
//   transports: ['websocket', 'polling'], // 优先 WebSocket，失败降级轮询
// });

// socket.on('connect', () => {
//   console.log('✅ 连接成功，等待接收推送... ID:', socket.id);
// });

// // 监听连接断开
// socket.on('disconnect', (reason) => {
//   // socket.active 为 true 表示会自动重连，false 表示需手动 connect
//   if (socket.active) {
//     console.log(`⚠️ 连接断开: ${reason}，正在自动重连...`);
//   } else {
//     console.log(`❌ 连接被服务端强制关闭: ${reason}，需手动重连`);
//   }
// });

// // 监听连接错误（如认证失败、网络不可达）
// socket.on('connect_error', (err) => {
//   console.log(`❌ 连接错误: ${err.message}`);
// });

// // 监听服务端推送
// socket.on('events', (data) => {
//   console.log('🔔 收到新通知:', JSON.stringify(data));
// });

// // 优雅退出：收到 Ctrl+C 或 kill 信号时主动断开
// const shutdown = (signal) => {
//   console.log(`\n收到 ${signal} 信号，正在关闭连接...`);
//   socket.disconnect();       // 主动断开，不再触发重连
//   process.exit(0);
// };

// process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
// process.on('SIGTERM', () => shutdown('SIGTERM')); // kill 命令

// // 占位提示，socket.io 内部的重连定时器会维持事件循环不退出
// console.log('🚀 客户端已启动，常驻监听中...');



const {
  createGamesSocketListener,
} = require('./games-socket-listener.cjs');

const DEFAULT_SOCKET_URL = 'http://localhost:3000';
const DEFAULT_EVENT_NAME = 'events';
const DEFAULT_TIMEOUT_MS = 5000;

/*
成功输出示例:
测试事件名称: events
已连接到服务端, Socket ID: SQm0Jfu7glvyzoEwAAAD
收到服务端 events: Hello from server!
*/

function normalizeUrl(value) {
  const text = String(value || '').trim();
  const markdownLink = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  return markdownLink ? markdownLink[2] : text;
}

function parseTimeoutMs(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

const socketUrl = normalizeUrl(process.argv[2] || DEFAULT_SOCKET_URL);
const eventName = String(process.argv[3] || DEFAULT_EVENT_NAME).trim() || DEFAULT_EVENT_NAME;
const timeoutMs = parseTimeoutMs(process.argv[4]);

let listener = null;
let finished = false;
let testEventSent = false;

console.log('准备通过 games-socket-listener 连接 Socket.IO 服务端:', socketUrl);
console.log('测试事件名称:', eventName);

// const timeout = setTimeout(() => {
//   // finish(1, '测试超时，未收到服务端响应');
// }, timeoutMs + 1000);

function stopListener(reason) {
  if (!listener) return null;
  try {
    const stopped = listener.stop(reason);
    console.log('listener 停止状态:', stopped);
    return stopped;
  } catch (error) {
    console.error('listener 停止失败:', error && error.message ? error.message : String(error));
    return null;
  }
}

function finish(code, message) {
  if (finished) return;
  finished = true;
  // clearTimeout(timeout);
  stopListener(code === 0 ? 'test-complete' : 'test-failed');
  if (message) {
    if (code === 0) {
      console.log(message);
    } else {
      console.error(message);
    }
  }
  process.exit(code);
}

listener = createGamesSocketListener({
  socketUrl,
  events: [eventName],
  getAuthPayload: () => ({
    source: 'games-socket-listener.test.cjs',
    at: Date.now(),
  }),
  notifyStatus: (status) => {
    console.log('listener 生命周期状态:', status);
    if (status.reason !== 'connect' || testEventSent) return;

    console.log('已连接到服务端, Socket ID:', status.socketId);
    testEventSent = true;
    const sent = listener.emit(eventName, {
      msg: '你好服务端',
      at: Date.now(),
    });

    if (!sent) {
      finish(1, 'listener 已连接，但测试事件发送失败');
      return;
    }

    console.log('已通过 listener.emit 发送测试事件:', eventName);
  },
  notifyFailed: (payload) => {
    finish(1, 'listener 连接失败: ' + JSON.stringify(payload));
  },
  onGameEvent: async (name, payload) => {
    console.log(`收到服务端 ${name}:`, payload);
    console.log('listener 当前状态:', listener.status());
    // finish(0, 'games-socket-listener 生命周期测试完成');
  },
  log: (message) => console.log(message),
});

const started = listener.start('manual-test');
console.log('listener 启动状态:', started);

process.on('SIGINT', () => {
  finish(130, '测试已取消');
});
