import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建种子数据...')

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('password123', 10)

  // 免费用户
  const freeUser = await prisma.user.upsert({
    where: { email: 'free@example.com' },
    update: {},
    create: {
      name: '免费用户',
      email: 'free@example.com',
      password: hashedPassword,
      role: 'free',
    },
  })
  console.log('✅ 创建免费用户:', freeUser.email)

  // 基础版用户
  const basicUser = await prisma.user.upsert({
    where: { email: 'basic@example.com' },
    update: {},
    create: {
      name: '基础版用户',
      email: 'basic@example.com',
      password: hashedPassword,
      role: 'basic',
    },
  })
  console.log('✅ 创建基础版用户:', basicUser.email)

  // 专业版用户
  const proUser = await prisma.user.upsert({
    where: { email: 'pro@example.com' },
    update: {},
    create: {
      name: '专业版用户',
      email: 'pro@example.com',
      password: hashedPassword,
      role: 'pro',
    },
  })
  console.log('✅ 创建专业版用户:', proUser.email)

  // 企业版用户
  const enterpriseUser = await prisma.user.upsert({
    where: { email: 'enterprise@example.com' },
    update: {},
    create: {
      name: '企业版用户',
      email: 'enterprise@example.com',
      password: hashedPassword,
      role: 'enterprise',
    },
  })
  console.log('✅ 创建企业版用户:', enterpriseUser.email)

  // 创建示例商品
  const sampleProducts = [
    {
      userId: freeUser.id,
      name: '无线蓝牙耳机',
      description: '高品质无线蓝牙耳机，支持降噪功能',
      price: 29.99,
      currency: 'USD',
      category: '电子产品',
      status: 'active' as const,
    },
    {
      userId: freeUser.id,
      name: '智能手表',
      description: '多功能智能手表，支持心率监测',
      price: 49.99,
      currency: 'USD',
      category: '电子产品',
      status: 'active' as const,
    },
    {
      userId: proUser.id,
      name: '便携充电宝',
      description: '20000mAh大容量充电宝',
      price: 24.99,
      currency: 'USD',
      category: '配件',
      status: 'active' as const,
    },
  ]

  for (const product of sampleProducts) {
    await prisma.product.create({
      data: product,
    })
  }
  console.log('✅ 创建示例商品:', sampleProducts.length, '个')

  // 创建会员信息
  const memberships = [
    { userId: basicUser.id, plan: 'basic' as const, endDate: new Date('2025-12-31') },
    { userId: proUser.id, plan: 'pro' as const, endDate: new Date('2025-12-31') },
    { userId: enterpriseUser.id, plan: 'enterprise' as const, endDate: new Date('2025-12-31') },
  ]

  for (const membership of memberships) {
    await prisma.membership.upsert({
      where: { userId: membership.userId },
      update: {},
      create: {
        userId: membership.userId,
        plan: membership.plan,
        status: 'active' as const,
        endDate: membership.endDate,
        features: [],
      },
    })
  }
  console.log('✅ 创建会员信息:', memberships.length, '个')

  console.log('\n🎉 种子数据创建完成！\n')
  console.log('📋 测试账号:')
  console.log('   免费版: free@example.com / password123')
  console.log('   基础版: basic@example.com / password123')
  console.log('   专业版: pro@example.com / password123')
  console.log('   企业版: enterprise@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
