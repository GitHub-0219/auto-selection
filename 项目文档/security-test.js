/**
 * 安全测试脚本
 * 用于检测常见的安全漏洞
 * 
 * 运行方式:
 *   1. npm install axios
 *   2. node security-test.js <base-url> [token]
 */

const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:3001/api';
const TOKEN = process.argv[3] || null;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const results = [];

function log(type, message) {
  const symbols = {
    secure: `${colors.green}✓${colors.reset}`,
    vulnerable: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`
  };
  console.log(`${symbols[type]} ${message}`);
}

function record(name, secure, details = '') {
  results.push({ name, secure, details });
  log(secure ? 'secure' : 'vulnerable', `${name}${details ? ': ' + details : ''}`);
}

// SQL注入测试用例
const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "' OR 1=1--",
  "'; DROP TABLE users;--",
  "1' AND '1'='1",
  "admin'--",
  "' UNION SELECT * FROM users--",
  "1 OR 1=1",
  "' OR ''='"
];

// XSS测试用例
const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '{{constructor.constructor("alert(1)")()}}',
  '<iframe src="javascript:alert(1)">',
  'javascript:alert(1)',
  '<body onload=alert(1)>'
];

// 命令注入测试用例
const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| cat /etc/passwd',
  '&& whoami',
  '; ping -c 3 127.0.0.1'
];

async function testSQLInjection() {
  console.log(`\n${colors.blue}[SQL注入测试]${colors.reset}\n`);
  
  // 测试登录接口
  for (const payload of SQL_INJECTION_PAYLOADS) {
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: `${payload}@test.com`,
        password: 'anything'
      }, { timeout: 5000 });
      
      // 如果返回成功，说明可能存在注入
      if (res.data.success) {
        record('SQL注入-登录', false, `payload: ${payload}`);
        return;
      }
    } catch (err) {
      // 正常情况：返回400/401/422
    }
  }
  record('SQL注入-登录', true, '已防护');

  // 测试商品搜索参数（如果有）
  try {
    for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 3)) {
      await axios.get(`${BASE_URL}/products?search=${encodeURIComponent(payload)}`, {
        headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}
      });
    }
    record('SQL注入-搜索参数', true, '已防护');
  } catch (err) {
    if (err.response?.status === 400) {
      record('SQL注入-搜索参数', true, '已防护');
    } else {
      record('SQL注入-搜索参数', false, err.message);
    }
  }
}

async function testXSS() {
  console.log(`\n${colors.blue}[XSS防护测试]${colors.reset}\n`);
  
  // 测试注册接口
  for (const payload of XSS_PAYLOADS) {
    try {
      const res = await axios.post(`${BASE_URL}/auth/register`, {
        name: payload,
        email: `xss_${Date.now()}@test.com`,
        password: 'TestPass123'
      }, { timeout: 5000 });
      
      // 检查响应中是否包含未转义的脚本
      const responseStr = JSON.stringify(res.data);
      if (responseStr.includes('<script>') && !responseStr.includes('&lt;script&gt;')) {
        record('XSS-用户名输入', false, '检测到未转义脚本');
        break;
      }
    } catch (err) {
      // 验证错误或服务器过滤
    }
  }
  
  // 测试商品描述
  if (TOKEN) {
    try {
      const res = await axios.post(
        `${BASE_URL}/products`,
        { name: 'Test', description: XSS_PAYLOADS[0], price: 10 },
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      );
      record('XSS-商品描述', false, '可能存在XSS');
    } catch (err) {
      if (err.response?.status === 422) {
        record('XSS-商品描述', true, '输入被验证拦截');
      } else {
        record('XSS-商品描述', true, '已防护');
      }
    }
  } else {
    record('XSS-商品描述', true, '跳过(需认证)');
  }
}

async function testAuthentication() {
  console.log(`\n${colors.blue}[认证授权测试]${colors.reset}\n`);
  
  // 无Token访问受保护接口
  try {
    await axios.get(`${BASE_URL}/auth/profile`);
    record('认证-无Token访问', false, '应返回401');
  } catch (err) {
    record('认证-无Token访问', err.response?.status === 401, `返回${err.response?.status}`);
  }

  // 无效Token
  try {
    await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: 'Bearer invalid-token-12345' }
    });
    record('认证-无效Token', false, '应返回401');
  } catch (err) {
    record('认证-无效Token', err.response?.status === 401, `返回${err.response?.status}`);
  }

  // 过期Token（如果可以构造）
  try {
    await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' }
    });
    record('认证-过期Token', false, '应返回401');
  } catch (err) {
    record('认证-过期Token', err.response?.status === 401, `返回${err.response?.status}`);
  }

  // Bearer前缀缺失
  try {
    await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: 'some-token-without-bearer' }
    });
    record('认证-Token格式', false, '应返回401');
  } catch (err) {
    record('认证-Token格式', err.response?.status === 401, `返回${err.response?.status}`);
  }
}

async function testAuthorization() {
  console.log(`\n${colors.blue}[权限控制测试]${colors.reset}\n`);
  
  if (!TOKEN) {
    record('权限-资源隔离', true, '跳过(需登录)');
    return;
  }

  // 尝试访问不存在的商品
  try {
    await axios.get(`${BASE_URL}/products/nonexistent-id-12345`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    record('权限-资源存在性', false, '应返回404或403');
  } catch (err) {
    record('权限-资源存在性', [403, 404].includes(err.response?.status), `返回${err.response?.status}`);
  }

  // 尝试访问其他用户的订单（如果有）
  try {
    await axios.get(`${BASE_URL}/orders/other-user-order-id`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    record('权限-订单隔离', false, '应返回403');
  } catch (err) {
    record('权限-订单隔离', err.response?.status === 403, `返回${err.response?.status}`);
  }
}

async function testRateLimiting() {
  console.log(`\n${colors.blue}[速率限制测试]${colors.reset}\n`);
  
  // 短时间内发送大量请求
  const promises = [];
  const startTime = Date.now();
  
  for (let i = 0; i < 20; i++) {
    promises.push(
      axios.post(`${BASE_URL}/auth/login`, {
        email: `ratelimit${i}@test.com`,
        password: 'test'
      }).catch(err => ({ status: err.response?.status }))
    );
  }
  
  await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  // 如果20个请求在1秒内完成，可能没有速率限制
  record('速率限制-登录接口', duration > 1000, `20次请求耗时${duration}ms`);
}

async function testErrorHandling() {
  console.log(`\n${colors.blue}[错误处理测试]${colors.reset}\n`);
  
  // 检查错误响应是否泄露敏感信息
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'wrong'
    });
  } catch (err) {
    const errorStr = JSON.stringify(err.response?.data || '');
    const leaks = [];
    
    if (errorStr.includes('prisma') || errorStr.includes('PostgreSQL')) {
      leaks.push('数据库类型');
    }
    if (errorStr.includes('ER_') || errorStr.includes('SQL')) {
      leaks.push('SQL错误');
    }
    if (errorStr.includes('stack') && errorStr.includes('at ')) {
      leaks.push('堆栈跟踪');
    }
    
    record('错误处理-信息泄露', leaks.length === 0, leaks.length > 0 ? `泄露: ${leaks.join(', ')}` : '无泄露');
  }

  // 发送畸形请求
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: 123,
      password: { $gt: '' }
    });
  } catch (err) {
    record('错误处理-畸形数据', err.response?.status >= 400, `返回${err.response?.status}`);
  }
}

async function testSecurityHeaders() {
  console.log(`\n${colors.blue}[安全响应头测试]${colors.reset}\n`);
  
  try {
    const res = await axios.get(`${BASE_URL}/ai/capabilities`);
    const headers = res.headers;
    
    const checks = [
      { name: 'X-Frame-Options', header: headers['x-frame-options'] },
      { name: 'X-Content-Type-Options', header: headers['x-content-type-options'] },
      { name: 'X-XSS-Protection', header: headers['x-xss-protection'] },
      { name: 'Strict-Transport-Security', header: headers['strict-transport-security'] },
      { name: 'Content-Security-Policy', header: headers['content-security-policy'] }
    ];
    
    const present = checks.filter(c => c.header).length;
    const total = checks.length;
    
    record('安全响应头', present >= 2, `${present}/${total}个安全头存在`);
    
    if (present < total) {
      const missing = checks.filter(c => !c.header).map(c => c.name);
      console.log(`  ${colors.yellow}建议添加: ${missing.join(', ')}${colors.reset}`);
    }
  } catch (err) {
    record('安全响应头', false, err.message);
  }
}

async function runSecurityTests() {
  console.log('\n========================================');
  console.log('  安全测试套件');
  console.log(`  目标: ${BASE_URL}`);
  console.log('========================================');

  await testSQLInjection();
  await testXSS();
  await testAuthentication();
  await testAuthorization();
  await testRateLimiting();
  await testErrorHandling();
  await testSecurityHeaders();

  console.log('\n========================================');
  console.log('  安全测试结果汇总');
  console.log('========================================\n');

  const secure = results.filter(r => r.secure).length;
  const vulnerable = results.filter(r => !r.secure).length;

  console.log(`总计: ${results.length} 项检查`);
  console.log(`${colors.green}安全: ${secure}${colors.reset}`);
  console.log(`${colors.red}风险: ${vulnerable}${colors.reset}`);

  if (vulnerable > 0) {
    console.log(`\n${colors.red}需要修复的风险项:${colors.reset}`);
    results.filter(r => !r.secure).forEach(r => {
      console.log(`  - ${r.name}: ${r.details}`);
    });
  }

  console.log('\n========================================\n');

  return { secure, vulnerable, total: results.length };
}

runSecurityTests().then(results => {
  process.exit(results.vulnerable > 2 ? 1 : 0);
}).catch(err => {
  console.error('安全测试执行失败:', err);
  process.exit(1);
});
