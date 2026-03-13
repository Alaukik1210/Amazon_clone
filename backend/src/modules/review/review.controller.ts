import { Request, Response, NextFunction } from "express";
import * as reviewService from "./review.service";
import type { ReviewQuery } from "./review.validation";

export async function listReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewService.listReviews(
      String(req.params.productId),
      res.locals.query as ReviewQuery
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.createReview(
      req.user!.id,
      String(req.params.productId),
      req.body
    );
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    await reviewService.deleteReview(
      String(req.params.reviewId),
      req.user!.id,
      req.user!.role === "ADMIN"
    );
    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}
