/**
 * 性能测试脚本
 * 用于测试API响应时间和并发处理能力
 * 
 * 运行方式:
 *   1. npm install axios
 *   2. node performance-test.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const CONCURRENT_USERS = 10;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[96m',
  reset: '\x1b[0m'
};

const results = [];

function log(type, message) {
  const symbols = {
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    data: `${colors.cyan}◆${colors.reset}`
  };
  console.log(`${symbols[type]} ${message}`);
}

function record(name, passed, details = {}) {
  results.push({ name, passed, ...details });
  const detailStr = details.responseTime ? `${details.responseTime}ms` : 
                    details.avgResponseTime ? `avg: ${details.avgResponseTime}ms` :
                    details.message || '';
  log(passed ? 'pass' : 'fail', `${name}${detailStr ? ': ' + detailStr : ''}`);
}

// 模拟用户操作
class LoadSimulator {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      responseTimes: []
    };
  }

  async login() {
    const email = `loadtest_${Date.now()}@example.com`;
    try {
      // 先注册
      await axios.post(`${this.baseUrl}/auth/register`, {
        name: 'Load Test User',
        email: email,
        password: 'LoadTest123'
      });
    } catch (e) {
      // 用户可能已存在
    }

    // 登录获取token
    try {
      const res = await axios.post(`${this.baseUrl}/auth/login`, {
        email: email,
        password: 'LoadTest123'
      });
      this.token = res.data.data?.token || 'mock-token';
      return true;
    } catch (e) {
      return false;
    }
  }

  getHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async measureRequest(name, method, path, data = null, options = {}) {
    const startTime = Date.now();
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: options.timeout || 30000
      };

      let res;
      if (method === 'GET') {
        res = await axios.get(`${this.baseUrl}${path}`, config);
      } else if (method === 'POST') {
        res = await axios.post(`${this.baseUrl}${path}`, data, config);
      } else if (method === 'PUT') {
        res = await axios.put(`${this.baseUrl}${path}`, data, config);
      } else if (method === 'DELETE') {
        res = await axios.delete(`${this.baseUrl}${path}`, config);
      }

      const responseTime = Date.now() - startTime;
      this.stats.totalRequests++;
      this.stats.successfulRequests++;
      this.stats.totalResponseTime += responseTime;
      this.stats.responseTimes.push(responseTime);

      return { success: true, responseTime, status: res?.status };
    } catch (err) {
      const responseTime = Date.now() - startTime;
      this.stats.totalRequests++;
      this.stats.failedRequests++;
      this.stats.totalResponseTime += responseTime;
      this.stats.responseTimes.push(responseTime);

      return { success: false, responseTime, error: err.message, status: err.response?.status };
    }
  }
}

// 单次请求测试
async function testSingleRequestPerformance() {
  console.log(`\n${colors.blue}[单次请求性能测试]${colors.reset}\n`);

  const simulator = new LoadSimulator(BASE_URL);
  await simulator.login();

  // 测试登录响应时间
  const loginResult = await simulator.measureRequest('登录接口', 'POST', '/auth/login', {
    email: 'test@example.com',
    password: 'TestPass123'
  });
  record('PERF-单次-登录', loginResult.responseTime < 1000, {
    responseTime: loginResult.responseTime,
    threshold: 1000
  });

  // 测试AI选品响应时间
  const aiResult = await simulator.measureRequest('AI选品', 'POST', '/ai/analyze-products', {
    keywords: ['电子产品', '蓝牙耳机']
  });
  record('PERF-单次-AI选品', aiResult.responseTime < 3000, {
    responseTime: aiResult.responseTime,
    threshold: 3000
  });

  // 测试AI翻译响应时间
  const translateResult = await simulator.measureRequest('AI翻译', 'POST', '/ai/translate', {
    content: 'Hello World',
    targetLang: 'en'
  });
  record('PERF-单次-AI翻译', translateResult.responseTime < 2000, {
    responseTime: translateResult.responseTime,
    threshold: 2000
  });

  // 测试AI定价响应时间
  const priceResult = await simulator.measureRequest('AI定价', 'POST', '/ai/suggest-price', {
    cost: 10.00,
    targetMarket: '北美'
  });
  record('PERF-单次-AI定价', priceResult.responseTime < 1000, {
    responseTime: priceResult.responseTime,
    threshold: 1000
  });

  // 测试公开接口（AI能力查询）
  const capResult = await simulator.measureRequest('AI能力查询(公开)', 'GET', '/ai/capabilities');
  record('PERF-单次-公开接口', capResult.responseTime < 500, {
    responseTime: capResult.responseTime,
    threshold: 500
  });

  return simulator;
}

// 多次请求平均值测试
async function testAverageResponseTime() {
  console.log(`\n${colors.blue}[平均响应时间测试]${colors.reset}\n`);

  const simulator = new LoadSimulator(BASE_URL);
  await simulator.login();

  const endpoints = [
    { name: '登录接口', method: 'POST', path: '/auth/login', data: { email: 'test@example.com', password: 'test' } },
    { name: 'AI选品', method: 'POST', path: '/ai/analyze-products', data: { keywords: ['test'] } },
    { name: 'AI能力查询', method: 'GET', path: '/ai/capabilities' }
  ];

  for (const endpoint of endpoints) {
    const times = [];
    const iterations = 5;

    for (let i = 0; i < iterations; i++) {
      const result = await simulator.measureRequest(endpoint.name, endpoint.method, endpoint.path, endpoint.data);
      times.push(result.responseTime);
      await new Promise(r => setTimeout(r, 100)); // 短暂延迟
    }

    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const max = Math.max(...times);
    const min = Math.min(...times);

    log('data', `${endpoint.name}: avg=${avg}ms, min=${min}ms, max=${max}ms`);
    
    const threshold = endpoint.name.includes('登录') ? 1000 : 3000;
    record(`平均-${endpoint.name}`, avg < threshold, { avgResponseTime: avg, threshold });
  }
}

// 并发测试
async function testConcurrentUsers() {
  console.log(`\n${colors.blue}[并发测试 - ${CONCURRENT_USERS} 用户]${colors.reset}\n`);

  const simulators = [];
  
  // 创建多个模拟用户
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const simulator = new LoadSimulator(BASE_URL);
    await simulator.login();
    simulators.push(simulator);
  }

  console.log(`  ${colors.yellow}启动 ${CONCURRENT_USERS} 个并发用户...${colors.reset}`);

  const startTime = Date.now();
  
  // 所有用户同时发起请求
  const promises = simulators.map((sim, i) => 
    sim.measureRequest(`用户${i+1}-AI选品`, 'POST', '/ai/analyze-products', { keywords: ['test'] })
  );

  const results = await Promise.all(promises);

  const totalTime = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );

  log('info', `总耗时: ${totalTime}ms`);
  log('info', `成功: ${successCount}/${CONCURRENT_USERS}`);
  log('info', `平均响应时间: ${avgResponseTime}ms`);

  record('并发-AI选品', successCount === CONCURRENT_USERS, {
    totalTime,
    successRate: `${successCount}/${CONCURRENT_USERS}`,
    avgResponseTime
  });

  // 测试登录并发
  const loginSimulators = [];
  for (let i = 0; i < Math.min(CONCURRENT_USERS, 5); i++) {
    const sim = new LoadSimulator(BASE_URL);
    await sim.login();
    loginSimulators.push(sim);
  }

  const loginStart = Date.now();
  const loginPromises = loginSimulators.map((sim, i) =>
    sim.measureRequest(`登录${i+1}`, 'POST', '/auth/login', { email: `concurrent${i}@test.com`, password: 'test' })
  );
  const loginResults = await Promise.all(loginPromises);
  const loginTotal = Date.now() - loginStart;

  record('并发-登录', loginTotal < 5000, {
    totalTime: loginTotal,
    avgResponseTime: Math.round(loginResults.reduce((sum, r) => sum + r.responseTime, 0) / loginResults.length)
  });

  return simulators;
}

// 压力测试 - 逐步增加负载
async function testStressLoad() {
  console.log(`\n${colors.blue}[压力测试 - 逐步增加负载]${colors.reset}\n`);

  const loads = [5, 10, 20];
  
  for (const load of loads) {
    const simulators = [];
    for (let i = 0; i < load; i++) {
      const sim = new LoadSimulator(BASE_URL);
      await sim.login();
      simulators.push(sim);
    }

    const startTime = Date.now();
    const promises = simulators.map(sim =>
      sim.measureRequest(`压力${load}用户-AI选品`, 'POST', '/ai/analyze-products', { keywords: ['stress test'] })
    );
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    const successRate = (results.filter(r => r.success).length / load * 100).toFixed(0);
    const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / load);

    log('info', `负载${load}用户: ${totalTime}ms, 成功率${successRate}%, 平均${avgResponseTime}ms`);
    
    record(`压力测试-${load}用户`, successRate >= 90, {
      totalTime,
      successRate: `${successRate}%`,
      avgResponseTime
    });

    await new Promise(r => setTimeout(r, 1000)); // 恢复时间
  }
}

// 数据库查询性能测试
async function testDatabasePerformance() {
  console.log(`\n${colors.blue}[数据库查询性能测试]${colors.reset}\n`);

  const simulator = new LoadSimulator(BASE_URL);
  await simulator.login();

  // 测试用户查询
  const userResult = await simulator.measureRequest('查询用户信息', 'GET', '/auth/profile');
  record('数据库-用户查询', userResult.responseTime < 500, {
    responseTime: userResult.responseTime
  });

  // 测试列表查询
  const listResult = await simulator.measureRequest('查询商品列表', 'GET', '/products?page=1&pageSize=20');
  record('数据库-商品列表', listResult.responseTime < 1000, {
    responseTime: listResult.responseTime
  });

  // 测试订单查询
  const orderResult = await simulator.measureRequest('查询订单列表', 'GET', '/orders?page=1&pageSize=20');
  record('数据库-订单列表', orderResult.responseTime < 1000, {
    responseTime: orderResult.responseTime
  });
}

// 汇总报告
function generateReport() {
  console.log('\n========================================');
  console.log('  性能测试结果汇总');
  console.log('========================================\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`总计: ${results.length} 项测试`);
  console.log(`${colors.green}通过: ${passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${failed}${colors.reset}`);
  console.log(`通过率: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  // 按类别分组显示
  const categories = {
    '单次请求': results.filter(r => r.name.includes('单次')),
    '平均响应': results.filter(r => r.name.includes('平均')),
    '并发测试': results.filter(r => r.name.includes('并发')),
    '压力测试': results.filter(r => r.name.includes('压力')),
    '数据库': results.filter(r => r.name.includes('数据库'))
  };

  for (const [cat, items] of Object.entries(categories)) {
    if (items.length > 0) {
      console.log(`\n${colors.blue}[${cat}]${colors.reset}`);
      items.forEach(r => {
        const status = r.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        const details = r.responseTime ? `${r.responseTime}ms` : 
                       r.avgResponseTime ? `avg: ${r.avgResponseTime}ms` : '';
        console.log(`  ${status} ${r.name.replace(/^(单次|平均|并发|压力|数据库)-/, '')} ${details}`);
      });
    }
  }

  if (failed > 0) {
    console.log(`\n${colors.red}性能不达标项:${colors.reset}`);
    results.filter(r => !r.passed).forEach(r => {
      const details = r.responseTime ? `${r.responseTime}ms (阈值: ${r.threshold || 'N/A'}ms)` :
                     r.avgResponseTime ? `avg: ${r.avgResponseTime}ms` :
                     r.totalTime ? `${r.totalTime}ms` : '';
      console.log(`  - ${r.name}: ${details}`);
    });
  }

  console.log('\n========================================\n');

  return { passed, failed, total: results.length };
}

// 主函数
async function main() {
  console.log('\n========================================');
  console.log('  性能测试套件');
  console.log(`  目标: ${BASE_URL}`);
  console.log(`  并发用户数: ${CONCURRENT_USERS}`);
  console.log('========================================');

  await testSingleRequestPerformance();
  await testAverageResponseTime();
  await testConcurrentUsers();
  await testDatabasePerformance();
  await testStressLoad();

  return generateReport();
}

main().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('性能测试执行失败:', err);
  process.exit(1);
});
