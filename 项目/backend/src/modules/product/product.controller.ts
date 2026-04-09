import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ProductService } from './product.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { IsString, IsNumber, IsOptional, Min } from 'class-validator'

export class CreateProductDto {
  @IsString()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @Min(0)
  price: number

  @IsString()
  @IsOptional()
  currency?: string

  @IsString()
  @IsOptional()
  category?: string
}

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.productService.findAll(
      req.user.id,
      parseInt(page),
      parseInt(pageSize),
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.productService.findOne(id, req.user.id)
  }

  @Post()
  async create(@Body() dto: CreateProductDto, @Request() req) {
    return this.productService.create(req.user.id, dto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>, @Request() req) {
    return this.productService.update(id, req.user.id, dto)
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return this.productService.delete(id, req.user.id)
  }
}
