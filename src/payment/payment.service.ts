import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async getPaymentsByShopAndRange(shopId: string, start: Date, end: Date) {
    console.log('[Payments][Service] getPaymentsByShopAndRange()', {
      shopId,
      start: start?.toISOString?.(),
      end: end?.toISOString?.(),
    });
    const payments = await (this.prisma as any).payment.findMany({
      where: {
        shopId,
        paidAt: { gte: start, lte: end },
      },
      orderBy: { paidAt: 'asc' },
    });
    console.log('[Payments][Service] Found payments:', payments?.length ?? 0);

    // If any payment has amount <= 0, repair amounts from costs
    const needsRepair = payments.filter((p: any) => !(typeof p.amount === 'number') || p.amount <= 0);
    if (needsRepair.length > 0) {
      console.log('[Payments][Service] Repairing invalid payment amounts:', needsRepair.length);
      const orderIds = needsRepair.map((p: any) => p.orderId);
      const costs = await this.prisma.cost.findMany({
        where: { orderId: { in: orderIds } },
        select: { orderId: true, totalCost: true, materialCost: true, laborCost: true },
      });
      const amountByOrder: Record<string, number> = {};
      costs.forEach((c) => {
        const amt = typeof c.totalCost === 'number' ? c.totalCost : (c.materialCost || 0) + (c.laborCost || 0);
        amountByOrder[c.orderId] = (amountByOrder[c.orderId] || 0) + amt;
      });
      for (const p of needsRepair) {
        const newAmount = amountByOrder[p.orderId] || 0;
        if (newAmount > 0) {
          await (this.prisma as any).payment.update({ where: { id: p.id }, data: { amount: newAmount } });
          p.amount = newAmount;
        }
      }
      console.log('[Payments][Service] Repair pass complete');
    }

    return payments;
  }

  // Backfill payments for delivered orders within range that are missing payment records
  async syncMissingPaymentsForRange(shopId: string, start: Date, end: Date) {
    // Find delivered orders for shop in date window
    const deliveredOrders = await this.prisma.order.findMany({
      where: {
        shopId,
        deletedAt: null,
        status: 'DELIVERED',
        OR: [
          { deliveryDate: { gte: start, lte: end } },
          { AND: [{ deliveryDate: null }, { orderDate: { gte: start, lte: end } }] },
        ],
      },
      select: { id: true, shopId: true, deliveryDate: true, orderDate: true },
      orderBy: { createdAt: 'asc' },
    });
    console.log('[Payments][Service] Delivered orders in range:', deliveredOrders.length);

    if (deliveredOrders.length === 0) return { created: 0 };

    const orderIds = deliveredOrders.map((o) => o.id);

    // Existing payments for these orders
    const existing = await (this.prisma as any).payment.findMany({
      where: { orderId: { in: orderIds } },
      select: { id: true, orderId: true, amount: true },
    });
    console.log('[Payments][Service] Existing payments for delivered orders:', existing.length);
    const existingByOrder: Map<string, { id: string; orderId: string; amount: number }> = new Map(
      existing.map((p: any) => [p.orderId as string, { id: String(p.id), orderId: String(p.orderId), amount: Number(p.amount) || 0 }])
    );

    // Costs for all relevant orders
    const costs = await this.prisma.cost.findMany({
      where: { orderId: { in: orderIds } },
      select: { orderId: true, totalCost: true, materialCost: true, laborCost: true },
    });
    const amountByOrder: Record<string, number> = {};
    costs.forEach((c) => {
      const amt = typeof c.totalCost === 'number' ? c.totalCost : (c.materialCost || 0) + (c.laborCost || 0);
      amountByOrder[c.orderId] = (amountByOrder[c.orderId] || 0) + amt;
    });

    // If no costs for an order, fall back to sum of clothes.materialCost
    const clothes = await this.prisma.cloth.findMany({
      where: { orderId: { in: orderIds } },
      select: { orderId: true, materialCost: true },
    });
    clothes.forEach((cl) => {
      const amt = typeof cl.materialCost === 'number' ? cl.materialCost : 0;
      amountByOrder[cl.orderId] = (amountByOrder[cl.orderId] || 0) + amt;
    });

    // Create payments where missing and amount > 0
    let created = 0;
    let updated = 0;
    for (const o of deliveredOrders) {
      const amount = amountByOrder[o.id] || 0;
      const existingPayment = existingByOrder.get(o.id);
      if (!existingPayment) {
        if (amount <= 0) continue;
        await (this.prisma as any).payment.create({
          data: {
            shopId: o.shopId,
            orderId: o.id,
            amount,
            paidAt: o.deliveryDate ?? o.orderDate ?? new Date(),
          },
        });
        created += 1;
      } else {
        const currentAmount = Number(existingPayment.amount) || 0;
        if (amount > 0 && Math.abs(currentAmount - amount) > 0.001) {
          await (this.prisma as any).payment.update({
            where: { id: existingPayment.id },
            data: { amount, paidAt: o.deliveryDate ?? o.orderDate ?? new Date() },
          });
          updated += 1;
        }
      }
    }

    console.log('[Payments][Service] Sync summary:', { created, updated });
    return { created, updated };
  }
}


