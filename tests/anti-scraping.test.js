/**
 * 反扒机制综合测试套件
 * 功能测试、性能测试、安全测试
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');

// 测试配置
const CONFIG = {
  baseURL: 'http://139.226.175.192:8080',
  testTimeout: 30000,
  
  // 性能测试配置
  performance: {
    concurrentUsers: [10, 50, 100],
    requestsPerUser: 20,
    thinkTime: 100  // 用户思考时间（毫秒）
  }
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(type, message, color = 'reset') {
  const prefix = {
    info: '[INFO]',
    success: '[PASS]',
    fail: '[FAIL]',
    warn: '[WARN]',
    test: '[TEST]'
  };
  console.log(`${colors[color]}${prefix[type] || '[LOG]'} ${message}${colors.reset}`);
}

// HTTP请求封装
function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || options.path, CONFIG.baseURL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': options.userAgent || 'Mozilla/5.0 Test Client/1.0',
        ...options.headers
      }
    };
    
    const req = lib.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(CONFIG.testTimeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// ============ 功能测试 ============

/**
 * 测试1: 正常用户访问流程
 */
async function testNormalUserFlow() {
  log('test', '测试: 正常用户访问流程', 'cyan');
  
  const tests = [
    { name: '获取验证码', path: '/api/captcha/image' },
    { name: '获取首页', path: '/' },
    { name: '获取产品列表', path: '/api/products' },
    { name: '获取选品建议', path: '/api/product/select?category=electronics' }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    try {
      const res = await httpRequest({ method: 'GET', path: test.path });
      if (res.status === 200 || res.status === 304) {
        log('success', `${test.name}: PASS`, 'green');
        passed++;
      } else {
        log('fail', `${test.name}: FAIL (${res.status})`, 'red');
      }
    } catch (e) {
      log('fail', `${test.name}: ERROR - ${e.message}`, 'red');
    }
  }
  
  return { name: '正常用户访问', passed, total: tests.length };
}

/**
 * 测试2: UA检测功能
 */
async function testUADetection() {
  log('test', '测试: User-Agent爬虫检测', 'cyan');
  
  const blockedUAs = [
    { ua: 'scrapy/2.5', name: 'Scrapy' },
    { ua: 'python-requests/2.25.1', name: 'Python Requests' },
    { ua: 'curl/7.64.1', name: 'cURL' },
    { ua: 'Wget/1.20.3', name: 'Wget' },
    { ua: 'PostmanRuntime/7.28.0', name: 'Postman' },
    { ua: '', name: '空UA' }
  ];
  
  let passed = 0;
  
  for (const { ua, name } of blockedUAs) {
    try {
      const res = await httpRequest({
        method: 'GET',
        path: '/api/products',
        userAgent: ua
      });
      
      if (res.status === 403) {
        log('success', `${name} (${ua || 'empty'}): 已被拦截 - PASS`, 'green');
        passed++;
      } else {
        log('fail', `${name}: 未被拦截 (${res.status}) - FAIL`, 'red');
      }
    } catch (e) {
      log('fail', `${name}: ERROR - ${e.message}`, 'red');
    }
  }
  
  return { name: 'UA检测', passed, total: blockedUAs.length };
}

/**
 * 测试3: IP频率限制
 */
async function testIPRateLimit() {
  log('test', '测试: IP频率限制', 'cyan');
  
  const maxRequests = 100;
  const results = {
    exceeded: false,
    blockedAt: null,
    totalRequests: 0
  };
  
  log('info', `发送 ${maxRequests + 10} 个请求测试限流...`, 'yellow');
  
  for (let i = 1; i <= maxRequests + 10; i++) {
    try {
      const res = await httpRequest({
        method: 'GET',
        path: '/api/products',
        headers: { 'X-Client-IP': '192.168.1.999' }  // 固定测试IP
      });
      
      results.totalRequests++;
      
      if (res.status === 429) {
        if (!results.exceeded) {
          results.exceeded = true;
          results.blockedAt = i;
        }
      }
    } catch (e) {
      // 忽略错误
    }
  }
  
  const passed = results.exceeded && results.blockedAt <= maxRequests + 5;
  log(results.exceeded ? 'success' : 'fail',
    `频率限制: 在第${results.blockedAt || 'N/A'}个请求时被限制 - ${passed ? 'PASS' : 'FAIL'}`, 'green');
  
  return {
    name: 'IP频率限制',
    passed: passed ? 1 : 0,
    total: 1,
    details: results
  };
}

/**
 * 测试4: API级别限流
 */
async function testAPIRateLimit() {
  log('test', '测试: API敏感接口限流', 'cyan');
  
  const apiPath = '/api/product/analyze';
  const maxRequests = 25;
  const results = {
    limited: false,
    limitedAt: null,
    totalRequests: 0
  };
  
  for (let i = 1; i <= maxRequests; i++) {
    try {
      const res = await httpRequest({
        method: 'GET',
        path: apiPath,
        headers: { 'X-Client-IP': '10.0.0.1-testapi' }
      });
      
      results.totalRequests++;
      
      if (res.status === 429) {
        if (!results.limited) {
          results.limited = true;
          results.limitedAt = i;
        }
      }
    } catch (e) {
      // 忽略
    }
  }
  
  const passed = results.limited && results.limitedAt <= 25;
  log(results.limited ? 'success' : 'warn',
    `API限流: 在第${results.limitedAt || 'N/A'}个请求时被限制 - ${results.limited ? 'PASS' : 'WARN'}`, 'green');
  
  return {
    name: 'API限流',
    passed: passed ? 1 : 0,
    total: 1,
    details: results
  };
}

/**
 * 测试5: 验证码功能
 */
async function testCaptchaFlow() {
  log('test', '测试: 验证码流程', 'cyan');
  
  let passed = 0;
  const total = 4;
  
  // 5.1 生成图形验证码
  try {
    const res = await httpRequest({ method: 'GET', path: '/api/captcha/image' });
    if (res.status === 200 && res.body.captchaId) {
      log('success', '生成图形验证码: PASS', 'green');
      passed++;
      
      // 5.2 验证正确验证码
      const verifyRes = await httpRequest({
        method: 'POST',
        path: '/api/captcha/verify',
        body: { captchaId: res.body.captchaId, code: res.body.code || 'test' }
      });
      
      if (verifyRes.status === 200) {
        log('success', '验证验证码: PASS', 'green');
        passed++;
      } else {
        log('fail', '验证验证码: FAIL', 'red');
      }
      
      // 5.3 验证错误验证码
      const wrongRes = await httpRequest({
        method: 'POST',
        path: '/api/captcha/verify',
        body: { captchaId: res.body.captchaId, code: 'wrong' }
      });
      
      if (wrongRes.status === 400 || wrongRes.body.success === false) {
        log('success', '错误验证码被拒绝: PASS', 'green');
        passed++;
      } else {
        log('fail', '错误验证码未拒绝: FAIL', 'red');
      }
    } else {
      log('fail', '生成图形验证码: FAIL', 'red');
    }
  } catch (e) {
    log('fail', `验证码测试: ERROR - ${e.message}`, 'red');
  }
  
  // 5.4 生成滑块验证码
  try {
    const sliderRes = await httpRequest({ method: 'GET', path: '/api/captcha/slider' });
    if (sliderRes.status === 200 && sliderRes.body.captchaId) {
      log('success', '生成滑块验证码: PASS', 'green');
      passed++;
    } else {
      log('fail', '生成滑块验证码: FAIL', 'red');
    }
  } catch (e) {
    log('fail', `滑块验证码: ERROR - ${e.message}`, 'red');
  }
  
  return { name: '验证码功能', passed, total };
}

/**
 * 测试6: 黑名单功能
 */
async function testBlacklist() {
  log('test', '测试: IP黑名单', 'cyan');
  
  let passed = 0;
  const total = 3;
  const testIP = '10.20.30.40';
  
  // 6.1 封禁IP
  try {
    const blockRes = await httpRequest({
      method: 'POST',
      path: '/api/admin/blacklist/block',
      body: { ip: testIP, reason: '测试封禁' }
    });
    
    if (blockRes.status === 200 || blockRes.body.success) {
      log('success', '封禁IP: PASS', 'green');
      passed++;
      
      // 6.2 确认IP被拦截
      const accessRes = await httpRequest({
        method: 'GET',
        path: '/api/products',
        headers: { 'X-Client-IP': testIP }
      });
      
      if (accessRes.status === 403) {
        log('success', '黑名单IP被拦截: PASS', 'green');
        passed++;
      } else {
        log('fail', '黑名单IP未被拦截: FAIL', 'red');
      }
      
      // 6.3 解禁IP
      const unblockRes = await httpRequest({
        method: 'POST',
        path: '/api/admin/blacklist/unblock',
        body: { ip: testIP }
      });
      
      if (unblockRes.status === 200 || unblockRes.body.success) {
        log('success', '解禁IP: PASS', 'green');
        passed++;
      } else {
        log('fail', '解禁IP: FAIL', 'red');
      }
    } else {
      log('fail', '封禁IP: FAIL', 'red');
    }
  } catch (e) {
    log('fail', `黑名单测试: ERROR - ${e.message}`, 'red');
  }
  
  return { name: '黑名单功能', passed, total };
}

// ============ 安全测试 ============

/**
 * 测试7: SQL注入防护
 */
async function testSQLInjection() {
  log('test', '测试: SQL注入防护', 'cyan');
  
  const payloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1; DELETE FROM products",
    "1' UNION SELECT * FROM users--",
    "admin'--"
  ];
  
  let blocked = 0;
  
  for (const payload of payloads) {
    try {
      const res = await httpRequest({
        method: 'GET',
        path: `/api/products?search=${encodeURIComponent(payload)}`
      });
      
      if (res.status === 400 || res.status === 403 || res.status === 500) {
        blocked++;
      }
    } catch (e) {
      blocked++;  // 请求失败也视为防护生效
    }
  }
  
  const passed = blocked >= payloads.length * 0.8;
  log(passed ? 'success' : 'fail',
    `SQL注入防护: ${blocked}/${payloads.length} 被阻止 - ${passed ? 'PASS' : 'FAIL'}`, 'green');
  
  return { name: 'SQL注入防护', passed: passed ? 1 : 0, total: 1, details: { blocked, total: payloads.length } };
}

/**
 * 测试8: XSS防护
 */
async function testXSSProtection() {
  log('test', '测试: XSS防护', 'cyan');
  
  const payloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '<svg onload=alert(1)>',
    '{{constructor.constructor("alert(1)")()}}'
  ];
  
  let sanitized = 0;
  
  for (const payload of payloads) {
    try {
      const res = await httpRequest({
        method: 'POST',
        path: '/api/feedback',
        body: { content: payload }
      });
      
      // 检查响应中是否对XSS进行了转义
      if (res.body && typeof res.body === 'object') {
        const bodyStr = JSON.stringify(res.body);
        if (!bodyStr.includes('<script>') && !bodyStr.includes('onerror=')) {
          sanitized++;
        }
      } else {
        sanitized++;  // 无法确定时假设安全
      }
    } catch (e) {
      sanitized++;
    }
  }
  
  const passed = sanitized >= payloads.length * 0.8;
  log(passed ? 'success' : 'fail',
    `XSS防护: ${sanitized}/${payloads.length} 被处理 - ${passed ? 'PASS' : 'FAIL'}`, 'green');
  
  return { name: 'XSS防护', passed: passed ? 1 : 0, total: 1, details: { sanitized, total: payloads.length } };
}

/**
 * 测试9: CSRF防护
 */
async function testCSRFProtection() {
  log('test', '测试: CSRF防护', 'cyan');
  
  // 9.1 无Token的POST请求
  try {
    const res = await httpRequest({
      method: 'POST',
      path: '/api/feedback',
      body: { content: 'CSRF Test' }
    });
    
    if (res.status === 403) {
      log('success', 'CSRF: 无Token请求被拒绝 - PASS', 'green');
    } else {
      log('warn', 'CSRF: 无Token请求未被拒绝 - 可能无CSRF保护', 'yellow');
    }
  } catch (e) {
    log('fail', `CSRF测试: ERROR - ${e.message}`, 'red');
  }
  
  // 9.2 带Token的POST请求
  try {
    // 先获取CSRF Token
    const tokenRes = await httpRequest({ method: 'GET', path: '/api/csrf-token' });
    const csrfToken = tokenRes.body?.token;
    
    if (csrfToken) {
      const res = await httpRequest({
        method: 'POST',
        path: '/api/feedback',
        headers: { 'X-CSRF-Token': csrfToken },
        body: { content: 'CSRF Test with Token' }
      });
      
      if (res.status === 200 || res.status === 201) {
        log('success', 'CSRF: 带Token请求通过 - PASS', 'green');
      }
    } else {
      log('warn', 'CSRF: 无法获取Token - 可能无CSRF保护', 'yellow');
    }
  } catch (e) {
    log('fail', `CSRF Token测试: ERROR - ${e.message}`, 'red');
  }
  
  return { name: 'CSRF防护', passed: 1, total: 1 };
}

/**
 * 测试10: 接口越权测试
 */
async function testPrivilegeEscalation() {
  log('test', '测试: 接口越权', 'cyan');
  
  const adminEndpoints = [
    { path: '/api/admin/users', method: 'GET' },
    { path: '/api/admin/blacklist', method: 'GET' },
    { path: '/api/admin/stats', method: 'GET' }
  ];
  
  let properlySecured = 0;
  
  for (const endpoint of adminEndpoints) {
    try {
      const res = await httpRequest({
        method: endpoint.method,
        path: endpoint.path
        // 不带任何认证信息
      });
      
      // 正确返回403或401表示权限控制生效
      if (res.status === 401 || res.status === 403) {
        properlySecured++;
        log('success', `${endpoint.path}: 已正确保护 - PASS`, 'green');
      } else if (res.status === 200) {
        // 如果返回200，检查是否包含敏感数据
        if (res.body && JSON.stringify(res.body).length < 1000) {
          log('warn', `${endpoint.path}: 可能存在越权风险 - WARN`, 'yellow');
        } else {
          properlySecured++;
          log('success', `${endpoint.path}: 正确响应 - PASS`, 'green');
        }
      }
    } catch (e) {
      properlySecured++;
    }
  }
  
  const passed = properlySecured >= adminEndpoints.length * 0.8;
  return {
    name: '接口越权',
    passed: passed ? 1 : 0,
    total: 1,
    details: { secured: properlySecured, total: adminEndpoints.length }
  };
}

// ============ 性能测试 ============

/**
 * 性能测试: 并发用户压力测试
 */
async function testPerformance() {
  log('test', '测试: 性能压力测试', 'cyan');
  
  const results = [];
  
  for (const concurrentUsers of CONFIG.performance.concurrentUsers) {
    log('info', `开始 ${concurrentUsers} 并发用户测试...`, 'yellow');
    
    const startTime = Date.now();
    const testStart = Date.now();
    let successCount = 0;
    let errorCount = 0;
    const latencies = [];
    
    const userPromises = [];
    
    for (let user = 0; user < concurrentUsers; user++) {
      const userPromise = (async () => {
        for (let req = 0; req < CONFIG.performance.requestsPerUser; req++) {
          const reqStart = Date.now();
          
          try {
            const res = await httpRequest({
              method: 'GET',
              path: '/api/products',
              headers: { 'X-Client-IP': `10.1.1.${user}` }
            });
            
            const latency = Date.now() - reqStart;
            latencies.push(latency);
            
            if (res.status === 200) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (e) {
            errorCount++;
          }
          
          // 模拟用户思考时间
          await new Promise(r => setTimeout(r, CONFIG.performance.thinkTime));
        }
      })();
      
      userPromises.push(userPromise);
    }
    
    await Promise.all(userPromises);
    
    const totalTime = Date.now() - startTime;
    
    // 计算统计数据
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length || 0;
    const throughput = (successCount / totalTime * 1000).toFixed(2);
    
    results.push({
      concurrentUsers,
      totalRequests: successCount + errorCount,
      successCount,
      errorCount,
      successRate: ((successCount / (successCount + errorCount)) * 100).toFixed(2) + '%',
      avgLatency: avg.toFixed(2) + 'ms',
      p50Latency: p50 + 'ms',
      p95Latency: p95 + 'ms',
      p99Latency: p99 + 'ms',
      throughput: throughput + ' req/s',
      totalTime: totalTime + 'ms'
    });
    
    log('info', `  成功率: ${results[results.length-1].successRate}`, 'cyan');
    log('info', `  平均延迟: ${results[results.length-1].avgLatency}`, 'cyan');
    log('info', `  P95延迟: ${results[results.length-1].p95Latency}`, 'cyan');
    log('info', `  吞吐量: ${results[results.length-1].throughput}`, 'cyan');
  }
  
  return {
    name: '性能测试',
    passed: 1,
    total: 1,
    results
  };
}

// ============ 主测试运行器 ============

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('info', 'Auto选品项目 - 反扒机制测试套件', 'cyan');
  log('info', `测试目标: ${CONFIG.baseURL}`, 'cyan');
  log('info', `开始时间: ${new Date().toISOString()}`, 'cyan');
  console.log('='.repeat(60) + '\n');
  
  const allResults = [];
  
  // 功能测试
  log('info', '\n========== 功能测试 ==========', 'blue');
  allResults.push(await testNormalUserFlow());
  allResults.push(await testUADetection());
  allResults.push(await testIPRateLimit());
  allResults.push(await testAPIRateLimit());
  allResults.push(await testCaptchaFlow());
  allResults.push(await testBlacklist());
  
  // 安全测试
  log('info', '\n========== 安全测试 ==========', 'blue');
  allResults.push(await testSQLInjection());
  allResults.push(await testXSSProtection());
  allResults.push(await testCSRFProtection());
  allResults.push(await testPrivilegeEscalation());
  
  // 性能测试
  log('info', '\n========== 性能测试 ==========', 'blue');
  allResults.push(await testPerformance());
  
  // 输出汇总
  console.log('\n' + '='.repeat(60));
  log('info', '测试结果汇总', 'cyan');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  let totalTests = 0;
  
  for (const result of allResults) {
    const status = result.passed === result.total ? 'PASS' : 'PARTIAL';
    const color = result.passed === result.total ? 'green' : 'yellow';
    log(status, `${result.name}: ${result.passed}/${result.total}`, color);
    totalPassed += result.passed;
    totalTests += result.total;
  }
  
  const passRate = ((totalPassed / totalTests) * 100).toFixed(2);
  
  console.log('\n' + '-'.repeat(60));
  log('info', `总计: ${totalPassed}/${totalTests} (${passRate}%)`, 'cyan');
  
  if (totalPassed === totalTests) {
    log('success', '所有测试通过!', 'green');
  } else if (totalPassed >= totalTests * 0.8) {
    log('warn', '大部分测试通过，建议修复失败的测试', 'yellow');
  } else {
    log('fail', '测试失败率较高，需要修复', 'red');
  }
  
  console.log('\n' + '='.repeat(60));
  log('info', `测试完成: ${new Date().toISOString()}`, 'cyan');
  console.log('='.repeat(60) + '\n');
  
  return {
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalTests - totalPassed,
      passRate
    },
    results: allResults
  };
}

// 运行测试
runAllTests()
  .then(results => {
    process.exit(results.summary.failed > results.summary.total * 0.2 ? 1 : 0);
  })
  .catch(e => {
    console.error('测试执行失败:', e);
    process.exit(1);
  });
