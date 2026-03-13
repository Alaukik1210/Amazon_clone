import { Request, Response, NextFunction } from "express";
import { OrderStatus, PaymentMode } from "@prisma/client";
import * as orderService from "./order.service";
import type { OrderQuery, AdminOrderQuery } from "./order.validation";

export async function placeOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { addressId, paymentMode } = req.body as { addressId: string; paymentMode: PaymentMode };
    const result = await orderService.placeOrder(req.user!.id, addressId, paymentMode);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orderService.getMyOrders(req.user!.id, res.locals.query as OrderQuery);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const isAdmin = req.user!.role === "ADMIN";
    const order = await orderService.getOrderById(String(req.params.id), req.user!.id, isAdmin);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function downloadOrderInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const isAdmin = req.user!.role === "ADMIN";
    const invoice = await orderService.generateOrderInvoice(String(req.params.id), req.user!.id, isAdmin);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.fileName}"`);
    res.status(200).send(invoice.buffer);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.cancelOrder(String(req.params.id), req.user!.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.updateOrderStatus(String(req.params.id), req.body.status as OrderStatus);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function getAllOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orderService.getAllOrders(res.locals.query as AdminOrderQuery);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
