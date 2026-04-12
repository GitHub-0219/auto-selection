/**
 * API集成测试脚本
 * 用于测试后端API各项功能
 * 
 * 运行方式:
 *   1. 先确保后端服务运行在 localhost:3001
 *   2. npm install axios
 *   3. node test-api.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const testResults = [];

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(type, message) {
  const symbols = {
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`
  };
  console.log(`${symbols[type]} ${message}`);
}

function recordResult(name, passed, details = '') {
  testResults.push({ name, passed, details });
  log(passed ? 'pass' : 'fail', `${name}${details ? ': ' + details : ''}`);
}

// 测试用例
async function runTests() {
  console.log('\n========================================');
  console.log('  AI跨境新手加速器 - API集成测试');
  console.log('========================================\n');

  let token = null;
  let testUserEmail = `test_${Date.now()}@example.com`;

  // ==================== 用户模块测试 ====================
  console.log(`${colors.blue}[用户模块测试]${colors.reset}\n`);

  // UM-001: 用户注册
  try {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test User',
      email: testUserEmail,
      password: 'TestPass123'
    });
    recordResult('UM-001 用户注册', res.data.success === true, '注册成功');
    testUserEmail = res.data.data?.email || testUserEmail;
  } catch (err) {
    recordResult('UM-001 用户注册', false, err.response?.data?.message || err.message);
  }

  // UM-002: 重复邮箱注册
  try {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Another User',
      email: testUserEmail,
      password: 'TestPass123'
    });
    recordResult('UM-002 重复邮箱注册', res.data.success === false, '应返回失败');
  } catch (err) {
    recordResult('UM-002 重复邮箱注册', true, '正确拒绝重复注册');
  }

  // UM-003: 密码过短
  try {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Short Pass',
      email: `short_${Date.now()}@example.com`,
      password: '123'
    });
    recordResult('UM-003 密码过短', false, '应返回验证错误');
  } catch (err) {
    recordResult('UM-003 密码过短', err.response?.status === 422, '正确返回422');
  }

  // UM-004: 无效邮箱
  try {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'TestPass123'
    });
    recordResult('UM-004 无效邮箱', false, '应返回验证错误');
  } catch (err) {
    recordResult('UM-004 无效邮箱', err.response?.status === 422, '正确返回422');
  }

  // UM-005: 用户登录
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: testUserEmail,
      password: 'TestPass123'
    });
    if (res.data.success && res.data.data?.user) {
      token = res.headers['authorization']?.replace('Bearer ', '') || 
              res.data.data?.token || 
              'mock-token';
      recordResult('UM-005 用户登录', true, '登录成功');
    } else {
      recordResult('UM-005 用户登录', false, '返回数据格式异常');
    }
  } catch (err) {
    recordResult('UM-005 用户登录', false, err.response?.data?.message || err.message);
  }

  // UM-006: 密码错误
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: testUserEmail,
      password: 'WrongPassword'
    });
    recordResult('UM-006 密码错误', res.data.success === false, '正确拒绝');
  } catch (err) {
    recordResult('UM-006 密码错误', true, '正确拒绝错误密码');
  }

  // UM-007: 用户不存在
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'nonexistent@example.com',
      password: 'TestPass123'
    });
    recordResult('UM-007 用户不存在', res.data.success === false, '正确返回失败');
  } catch (err) {
    recordResult('UM-007 用户不存在', true, '正确拒绝不存在的用户');
  }

  // ==================== Token验证测试 ====================
  console.log(`\n${colors.blue}[Token验证测试]${colors.reset}\n`);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // UM-008: 有效Token访问受保护接口
  try {
    const res = await axios.get(`${API_BASE}/auth/profile`, { headers: authHeaders });
    recordResult('UM-008 有效Token访问', res.status === 200, '访问成功');
  } catch (err) {
    recordResult('UM-008 有效Token访问', false, err.message);
  }

  // UM-009: 无效Token访问
  try {
    const res = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    recordResult('UM-009 无效Token访问', false, '应返回401');
  } catch (err) {
    recordResult('UM-009 无效Token访问', err.response?.status === 401, '正确返回401');
  }

  // UM-010: 无Token访问
  try {
    const res = await axios.get(`${API_BASE}/auth/profile`);
    recordResult('UM-010 无Token访问', false, '应返回401');
  } catch (err) {
    recordResult('UM-010 无Token访问', err.response?.status === 401, '正确返回401');
  }

  // ==================== AI模块测试 ====================
  console.log(`\n${colors.blue}[AI选品模块测试]${colors.reset}\n`);

  const aiHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // AI-001: 智能选品
  try {
    const res = await axios.post(
      `${API_BASE}/ai/analyze-products`,
      { keywords: ['蓝牙耳机', '无线充电'] },
      { headers: aiHeaders }
    );
    recordResult('AI-001 智能选品', res.data.success === true, '返回推荐结果');
  } catch (err) {
    recordResult('AI-001 智能选品', false, err.response?.data?.message || err.message);
  }

  // AI-002: 空关键词
  try {
    const res = await axios.post(
      `${API_BASE}/ai/analyze-products`,
      { keywords: [] },
      { headers: aiHeaders }
    );
    recordResult('AI-002 空关键词', false, '应返回验证错误');
  } catch (err) {
    recordResult('AI-002 空关键词', err.response?.status === 422, '正确返回422');
  }

  // AI-004: 描述优化
  try {
    const res = await axios.post(
      `${API_BASE}/ai/optimize-description`,
      { productName: '无线耳机', description: '高品质无线耳机' },
      { headers: aiHeaders }
    );
    recordResult('AI-004 描述优化', res.data.success === true, '优化成功');
  } catch (err) {
    recordResult('AI-004 描述优化', false, err.response?.data?.message || err.message);
  }

  // AI-006: 翻译功能
  try {
    const res = await axios.post(
      `${API_BASE}/ai/translate`,
      { content: 'Hello World', targetLang: 'en' },
      { headers: aiHeaders }
    );
    recordResult('AI-006 翻译功能', res.data.success === true, '翻译成功');
  } catch (err) {
    recordResult('AI-006 翻译功能', false, err.response?.data?.message || err.message);
  }

  // AI-009: 智能定价
  try {
    const res = await axios.post(
      `${API_BASE}/ai/suggest-price`,
      { cost: 10.00, targetMarket: '北美' },
      { headers: aiHeaders }
    );
    const hasPrice = res.data.data?.suggestedPrice > 0;
    recordResult('AI-009 智能定价', hasPrice, hasPrice ? '返回定价建议' : '定价计算异常');
  } catch (err) {
    recordResult('AI-009 智能定价', false, err.response?.data?.message || err.message);
  }

  // AI-011: AI对话
  try {
    const res = await axios.post(
      `${API_BASE}/ai/chat`,
      { message: '如何选品？' },
      { headers: aiHeaders }
    );
    recordResult('AI-011 AI对话', res.data.success === true, '返回回复');
  } catch (err) {
    recordResult('AI-011 AI对话', false, err.response?.data?.message || err.message);
  }

  // AI公共接口
  try {
    const res = await axios.get(`${API_BASE}/ai/capabilities`);
    recordResult('AI-012 AI能力查询', res.data.success === true, '返回能力列表');
  } catch (err) {
    recordResult('AI-012 AI能力查询', false, err.message);
  }

  // ==================== 安全测试 ====================
  console.log(`\n${colors.blue}[安全模块测试]${colors.reset}\n`);

  // SEC-001: SQL注入测试-登录
  try {
    const payloads = [
      "admin' OR '1'='1",
      "'; DROP TABLE users;--",
      "1 OR 1=1"
    ];
    let blocked = true;
    for (const payload of payloads) {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: `${payload}@test.com`,
        password: 'anything'
      });
      if (res.status === 200 && res.data.success) {
        blocked = false;
      }
    }
    recordResult('SEC-001 SQL注入-登录', blocked, blocked ? '已防护' : '存在注入风险');
  } catch (err) {
    recordResult('SEC-001 SQL注入-登录', true, '请求被正确拦截');
  }

  // SEC-004: XSS测试-用户名
  try {
    const xssPayloads = ['<script>alert(1)</script>', '{{constructor.constructor("alert(1)")()}}'];
    let sanitized = true;
    for (const payload of xssPayloads) {
      const res = await axios.post(`${API_BASE}/auth/register`, {
        name: payload,
        email: `xss_${Date.now()}@test.com`,
        password: 'TestPass123'
      });
      // 检查响应是否转义
      if (res.data.data?.name && res.data.data.name.includes('<script>')) {
        sanitized = false;
      }
    }
    recordResult('SEC-004 XSS防护', sanitized, '输入已处理');
  } catch (err) {
    recordResult('SEC-004 XSS防护', true, '请求被正确处理');
  }

  // SEC-007: 未授权访问
  try {
    const res = await axios.get(`${API_BASE}/products`);
    recordResult('SEC-007 未授权访问', false, '应返回401');
  } catch (err) {
    recordResult('SEC-007 未授权访问', err.response?.status === 401, '正确返回401');
  }

  // ==================== 性能测试 ====================
  console.log(`\n${colors.blue}[性能测试]${colors.reset}\n`);

  // PERF-001: 登录响应时间
  try {
    const start = Date.now();
    await axios.post(`${API_BASE}/auth/login`, {
      email: testUserEmail,
      password: 'TestPass123'
    });
    const duration = Date.now() - start;
    recordResult('PERF-001 登录响应时间', duration < 1000, `${duration}ms`);
  } catch (err) {
    recordResult('PERF-001 登录响应时间', false, err.message);
  }

  // PERF-002: AI选品响应时间
  try {
    const start = Date.now();
    await axios.post(
      `${API_BASE}/ai/analyze-products`,
      { keywords: ['电子产品'] },
      { headers: aiHeaders }
    );
    const duration = Date.now() - start;
    recordResult('PERF-002 AI选品响应', duration < 3000, `${duration}ms`);
  } catch (err) {
    recordResult('PERF-002 AI选品响应', false, err.message);
  }

  // ==================== 测试结果汇总 ====================
  console.log('\n========================================');
  console.log('  测试结果汇总');
  console.log('========================================\n');

  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;

  console.log(`总计: ${testResults.length} 个测试用例`);
  console.log(`${colors.green}通过: ${passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${failed}${colors.reset}`);
  console.log(`通过率: ${((passed / testResults.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log(`\n${colors.red}失败的测试:${colors.reset}`);
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.details}`);
    });
  }

  console.log('\n========================================\n');

  return { passed, failed, total: testResults.length };
}

// 运行测试
runTests().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('测试执行失败:', err);
  process.exit(1);
});
