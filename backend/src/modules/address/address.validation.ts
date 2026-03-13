import { z } from "zod";

const addressFields = {
  street: z.string().min(3).max(200),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(2).max(100),
  isDefault: z.boolean().optional(),
};

export const createAddressSchema = z.object(addressFields);

export const updateAddressSchema = z.object(addressFields).partial();
