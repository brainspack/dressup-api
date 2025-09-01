import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // GET /payments?shopId=...&start=ISO&end=ISO
  @Get()
  async getByRange(
    @Query('shopId') shopId: string,
    @Query('start') startIso: string,
    @Query('end') endIso: string,
  ) {
    // Debug: log incoming filter params
    console.log('[Payments][Controller] GET /payments called with:', {
      shopId,
      startIso,
      endIso,
    });
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date range');
    }
    console.log('[Payments][Controller] Parsed date range:', {
      start: start.toISOString(),
      end: end.toISOString(),
      days:
        Math.floor(
          (new Date(end.toISOString().slice(0, 10) + 'T00:00:00.000Z').getTime() -
            new Date(start.toISOString().slice(0, 10) + 'T00:00:00.000Z').getTime()) /
            (24 * 60 * 60 * 1000)
        ) + 1,
    });
    // First, backfill any missing payments for delivered orders in this range
    const sync = await this.paymentService.syncMissingPaymentsForRange(shopId, start, end);
    const payments = await this.paymentService.getPaymentsByShopAndRange(shopId, start, end);
    const total = Array.isArray(payments) ? payments.reduce((s, p: any) => s + (Number(p.amount) || 0), 0) : 0;
    console.log('[Payments][Controller] Response summary:', {
      paymentsCount: Array.isArray(payments) ? payments.length : 0,
      total,
      syncedCreated: sync?.created ?? 0,
      syncedUpdated: sync?.updated ?? 0,
    });
    return { payments, syncedCreated: sync?.created ?? 0, syncedUpdated: sync?.updated ?? 0, total };
  }
}


