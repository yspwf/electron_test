// Node.js 18+，无第三方依赖。
// 运行：node .\crypto-diagnose.cjs
// 也可指定文件：node .\crypto-diagnose.cjs .\crypto.js
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');

const scriptPath = path.resolve(__dirname, process.argv[2] || 'crypto.js');
const source = fs.readFileSync(scriptPath, 'utf8');

async function probe(label, offsetMs) {
  let report;
  let requestError;
  let scriptExitCode = 0;
  let context;

  context = vm.createContext({
    require: createRequire(scriptPath),
    Buffer,
    Date,
    // 原脚本只按 HTTP 状态打印“成功”，这里统一输出诊断日志。
    console: { log() {}, error() {} },
    process: { exit(code) { scriptExitCode = code; } },
    fetch: async (url, options) => {
      try {
        const headers = new Headers(options.headers);
        const originalTimestamp = headers.get('x-timestamp');
        const timestamp = Math.floor((Date.now() + offsetMs) / 1000);

        // 只在内存中覆盖请求头；两次请求各用新的 nonce。
        headers.set('x-timestamp', String(timestamp));
        headers.set('x-nonce', crypto.randomBytes(16).toString('hex'));

        const start = Date.now();
        console.log('\n' + label);
        console.log('请求:', JSON.stringify({
          url,
          method: options.method,
          originalTimestamp,
          actualHeaders: Object.fromEntries(headers),
          requestTimestampUTC: new Date(timestamp * 1000).toISOString(),
          offsetSeconds: offsetMs / 1000,
        }, null, 2));

        const response = await fetch(url, {
          ...options,
          headers,
          signal: AbortSignal.timeout(15000),
        });
        // 在收到响应头时结束计时，不把后续读取响应体的耗时算进去。
        const end = Date.now();
        const serverDate = response.headers.get('date');
        const serverMs = Date.parse(serverDate || '');
        const skewMs = Number.isFinite(serverMs)
          ? serverMs - (start + end) / 2
          : null;

        // 读取副本，原始 Response 仍交给 crypto.js 正常处理。
        const rawBody = await response.clone().text();
        let body;
        let bodyFormat = 'json';
        try {
          body = JSON.parse(rawBody);
        } catch {
          try {
            context.__diagnosticBody = rawBody;
            body = vm.runInContext(
              'JSON.parse(decrypt(__diagnosticBody))', context,
            );
            bodyFormat = 'encrypted-json';
          } catch {
            body = rawBody;
            bodyFormat = 'text';
          }
        }

        report = {
          httpStatus: response.status,
          finalUrl: response.url,
          redirected: response.redirected,
          localStartUTC: new Date(start).toISOString(),
          localEndUTC: new Date(end).toISOString(),
          serverDate,
          server: response.headers.get('server'),
          roundTripMs: end - start,
          // 正数表示响应 Date 比本机时间快；负数表示慢。
          serverMinusLocalSeconds: skewMs === null ? null : skewMs / 1000,
          bodyFormat,
          body,
        };
        console.log('响应:', JSON.stringify(report, null, 2));
        return response;
      } catch (error) {
        requestError = error;
        throw error;
      }
    },
  });

  // crypto.js 最后的 queryNetbar().then(...).catch(...) 返回 Promise。
  await vm.runInContext(source, context, { filename: scriptPath });
  if (requestError) throw requestError;
  if (!report) throw new Error('未捕获到请求，脚本退出码：' + scriptExitCode);
  return report;
}

async function main() {
  const first = await probe('第一次：使用本机 Unix 秒时间戳', 0);
  if (first.serverMinusLocalSeconds === null) {
    console.log('响应缺少有效的 Date 头，无法估算时间差，跳过第二次请求。');
    return;
  }

  const offsetMs = Math.round(first.serverMinusLocalSeconds * 1000);
  await probe('第二次：临时按测得的时间差补偿', offsetMs);
  console.log('\nDate 头可能来自网关，且只有秒精度；补偿仅用于诊断。');
}

main().catch((error) => {
  console.error('诊断失败:', error.message);
  if (error.cause) console.error('底层原因:', error.cause);
  process.exitCode = 1;
});
