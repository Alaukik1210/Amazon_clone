import { Request, Response, NextFunction } from "express";
import * as addressService from "./address.service";

export async function listAddresses(req: Request, res: Response, next: NextFunction) {
  try {
    const addresses = await addressService.listAddresses(req.user!.id);
    res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const address = await addressService.createAddress(req.user!.id, req.body);
    res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const address = await addressService.updateAddress(String(req.params.id), req.user!.id, req.body);
    res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

export async function setDefault(req: Request, res: Response, next: NextFunction) {
  try {
    const address = await addressService.setDefault(String(req.params.id), req.user!.id);
    res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req: Request, res: Response, next: NextFunction) {
  try {
    await addressService.deleteAddress(String(req.params.id), req.user!.id);
    res.status(200).json({ success: true, message: "Address deleted" });
  } catch (err) {
    next(err);
  }
}
