import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { userId } }),
    ])

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async findOne(id: string, userId: string) {
    return this.prisma.product.findFirst({
      where: { id, userId },
    })
  }

  async create(userId: string, data: any) {
    return this.prisma.product.create({
      data: {
        ...data,
        userId,
      },
    })
  }

  async update(id: string, userId: string, data: any) {
    return this.prisma.product.updateMany({
      where: { id, userId },
      data,
    })
  }

  async delete(id: string, userId: string) {
    return this.prisma.product.deleteMany({
      where: { id, userId },
    })
  }
}
