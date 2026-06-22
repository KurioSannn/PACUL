import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@ApiTags('orders')
@ApiBearerAuth('bearer')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles('industry')
  @ApiOperation({ summary: 'Create a material purchase order (industry)' })
  createOrder(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(user.id, dto);
  }

  @Get()
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'List orders for the authenticated party' })
  listOrders(@CurrentUser() user: AuthUser, @Query() filters: OrderFiltersDto) {
    return this.orderService.listOrders(user.id, user.role, filters.status);
  }

  @Get(':id')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'Get order detail by ID' })
  getOrder(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orderService.getOrder(id, user.id, user.role);
  }

  @Patch(':id/status')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'Transition order status' })
  transitionOrderStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.transitionOrderStatus(
      id,
      user.id,
      user.role,
      dto.status,
      {
        cancel_reason: dto.cancel_reason,
        final_price_per_kg: dto.final_price_per_kg,
        final_weight_kg: dto.final_weight_kg,
      },
    );
  }
}
