import { Request, Response, NextFunction } from "express";
import * as wishlistService from "./wishlist.service";

export async function getWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const wishlist = await wishlistService.getWishlist(req.user!.id);
    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction) {
  try {
    const wishlist = await wishlistService.addItem(req.user!.id, req.body.productId);
    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
}

export async function removeItem(req: Request, res: Response, next: NextFunction) {
  try {
    const wishlist = await wishlistService.removeItem(req.user!.id, String(req.params.itemId));
    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
}

export async function moveToCart(req: Request, res: Response, next: NextFunction) {
  try {
    const wishlist = await wishlistService.moveToCart(req.user!.id, String(req.params.itemId));
    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
}
