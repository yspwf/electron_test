// const crypto = require('crypto');

// const AES_KEY = Buffer.from('OT3agR1shNS0jivdg8t7kptgqUPltzPD', 'utf8');
// const TAG_LENGTH = 16;

// function encryptPayload(obj) {
//   const plain = JSON.stringify(obj);
//   const iv = crypto.randomBytes(12);
//   const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
//   const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
//   const authTag = cipher.getAuthTag();
//   return Buffer.concat([iv, authTag, encrypted]).toString('base64');
// }

// function decryptPayload(b64) {
//   const buf = Buffer.from(b64, 'base64');
//   const iv = buf.slice(0, 12);
//   const authTag = buf.slice(12, 12 + TAG_LENGTH);
//   const encrypted = buf.slice(12 + TAG_LENGTH);
//   const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv);
//   decipher.setAuthTag(authTag);
//   const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
//   return JSON.parse(decrypted.toString('utf8'));
// }

// const testObj = {
//   "store_name": "示例网吧",
//   "meituan_id": "",
//   "address": "门店地址",
//   "terminal_count": 10,
//   "phone": "13800000000",
//   "contact": "张三"
// };

// // console.log('原始对象:', testObj);
// // const encrypted = encryptPayload(testObj);
// // console.log('加密后的 Base64 字符串:', encrypted);
// const decrypted = decryptPayload('U/6npg/JYwQf4MiP4vWpgzArF1BKyEeNQGQCdXFXPVKvUHy1LFHf1Cj+Ho2VXolXz9xkSuxfHIiSYX31BtSl8r4cqPzITy7KqnoixRrSMHcpG/zyXu6jNKQsMTknUeP8a5Lb24GbhtsMYEZzBgpDEwLBlHrvZ2onWYBSfA3Li6oKgARnL+OFeDSfYvaQrijMeuPV4/I77rxhLs1FPSs2');
// console.log('解密后的对象:', decrypted);


// query_netbar.js
const crypto = require('crypto');

// ===== 配置 =====
const CONFIG = {
  host: 'test-wb-api.wanjiayizhan.com',                    // ← 替换成真实 host
  key: 'OT3agR1shNS0jivdg8t7kptgqUPltzPD',    // 32 字节密钥
  storeId: 5007,                              // ← 查询的门店 ID
};

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// // ===== 加密：返回 Base64( IV + Tag + CipherText ) =====
// function encrypt(plaintext) {
//   const key = Buffer.from(CONFIG.key, 'utf8');
//   const iv = crypto.randomBytes(IV_LENGTH);

//   const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
//   const encrypted = Buffer.concat([
//     cipher.update(plaintext, 'utf8'),
//     cipher.final(),
//   ]);
//   const tag = cipher.getAuthTag();

//   return Buffer.concat([iv, tag, encrypted]).toString('base64');
// }

const AES_KEY = Buffer.from('OT3agR1shNS0jivdg8t7kptgqUPltzPD', 'utf8');

function encrypt(obj) {
  const plain = JSON.stringify(obj);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

// ===== 解密：输入 Base64( IV + Tag + CipherText ) =====
function decrypt(encoded) {
  const key = Buffer.from(CONFIG.key, 'utf8');
  const data = Buffer.from(encoded, 'base64');

  if (data.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('响应数据过短: ' + encoded);
  }

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}

// ===== 生成 16 字节随机 hex nonce =====
function genNonce() {
  return crypto.randomBytes(16).toString('hex');
}

// ===== 查询门店 =====
async function queryNetbar() {
  // 1. 构造业务请求并加密
  const plaintext = { "store_id": 5007 };
  const payload = encrypt(plaintext);

  console.log('明文请求:', plaintext);
  console.log('加密 payload:', payload);
  console.log('请求 URL:', `https://${CONFIG.host}/api/v1/agent/xunweiyun/query_netbar`);

  // 2. 发送请求
  const res = await fetch(`https://${CONFIG.host}/api/v1/agent/xunweiyun/query_netbar`, {
    method: 'POST',
    headers: {
      'x-timestamp': Math.floor(Date.now() / 1000).toString(),
      'x-nonce': genNonce(),
      'Content-Type': 'text/plain',
    },
    body: payload, // base64 字符串，不包 JSON
  });

  console.log('HTTP 状态码:', res.status);

  // 3. 处理响应
  const rawBody = await res.text();

  if (!res.ok) {
    console.error('请求失败，响应内容:', rawBody);
    throw new Error(`请求失败: ${res.status} ${rawBody}`);
  }

  return rawBody;

  // 4. 解密响应
//   try {
//     const decrypted = decrypt(rawBody);
//     console.log('解密响应:', decrypted);
//     return JSON.parse(decrypted);
//   } catch (err) {
//     // 有些接口错误时返回明文 JSON
//     console.log('解密失败，尝试按明文解析:', rawBody);
//     try {
//       return JSON.parse(rawBody);
//     } catch {
//       throw new Error('响应既不是加密数据也不是 JSON: ' + rawBody);
//     }
//   }
}

// ===== 执行 =====
queryNetbar()
  .then((data) => {
    console.log('\n✅ 查询成功:');
    console.log(data);
    // console.log(JSON.stringify(data, null, 2));
  })
  .catch((err) => {
    console.error('\n❌ 查询失败:', err.message);
    process.exit(1);
  });
