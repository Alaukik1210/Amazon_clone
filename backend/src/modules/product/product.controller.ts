import { Request, Response, NextFunction } from "express";
import * as productService from "./product.service";
import type { ProductQuery } from "./product.validation";

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.listProducts(res.locals.query as ProductQuery);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getProductBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getProductBySlug(String(req.params.slug));
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.updateProduct(String(req.params.id), req.body);
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.deleteProduct(String(req.params.id));
    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (err) {
    next(err);
  }
}
