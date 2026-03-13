import { Request, Response, NextFunction } from "express";
import * as cartService from "./cart.service";

export async function getCart(req: Request, res: Response, next: NextFunction) {
  try {
    const cart = await cartService.getCart(req.user!.id);
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction) {
  try {
    const cart = await cartService.addItem(req.user!.id, req.body);
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const cart = await cartService.updateItem(
      req.user!.id,
      String(req.params.itemId),
      req.body.quantity
    );
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function removeItem(req: Request, res: Response, next: NextFunction) {
  try {
    const cart = await cartService.removeItem(req.user!.id, String(req.params.itemId));
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req: Request, res: Response, next: NextFunction) {
  try {
    await cartService.clearCart(req.user!.id);
    res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
}
