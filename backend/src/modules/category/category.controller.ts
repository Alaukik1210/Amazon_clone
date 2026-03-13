import { Request, Response, NextFunction } from "express";
import * as categoryService from "./category.service";

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.listCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.updateCategory(String(req.params.id), req.body);
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteCategory(String(req.params.id));
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (err) {
    next(err);
  }
}
