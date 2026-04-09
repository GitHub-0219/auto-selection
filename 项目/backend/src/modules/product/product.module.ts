import { Module } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { ProductController } from './product.controller'
import { ProductService } from './product.service'

@Module({
  controllers: [ProductController],
  providers: [ProductService, PrismaService],
  exports: [ProductService],
})
export class ProductModule {}
