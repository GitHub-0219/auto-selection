#!/usr/bin/env node
/**
 * 安全密钥生成工具
 * 用于生成 JWT_SECRET 等安全密钥
 * 
 * 使用方法:
 *   node scripts/generate-secrets.js
 *   node scripts/generate-secrets.js --length 64
 */

const crypto = require('crypto');

// 解析命令行参数
const args = process.argv.slice(2);
const lengthArg = args.find(arg => arg.startsWith('--length='));
const length = lengthArg ? parseInt(lengthArg.split('=')[1]) : 64;

// 生成随机密钥
const secret = crypto.randomBytes(length).toString('hex');

console.log('\n🔐 安全密钥生成工具\n');
console.log(`生成的密钥长度: ${length * 2} 字符\n`);
console.log('='.repeat(70));
console.log(`JWT_SECRET="${secret}"`);
console.log('='.repeat(70));
console.log('\n💡 使用说明:');
console.log('1. 复制上面的 JWT_SECRET 值');
console.log('2. 粘贴到您的 .env 文件中');
console.log('3. 不要将 .env 文件提交到代码仓库\n');
console.log('⚠️  安全建议:');
console.log('  - 每个环境（dev/staging/prod）应使用不同的密钥');
console.log('  - 定期轮换密钥');
console.log('  - 生产环境建议使用更长的密钥（128+ 字符）\n');
