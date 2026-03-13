"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAddressSchema = exports.createAddressSchema = void 0;
const zod_1 = require("zod");
const addressFields = {
    street: zod_1.z.string().min(3).max(200),
    city: zod_1.z.string().min(2).max(100),
    state: zod_1.z.string().min(2).max(100),
    postalCode: zod_1.z.string().min(3).max(20),
    country: zod_1.z.string().min(2).max(100),
    isDefault: zod_1.z.boolean().optional(),
};
exports.createAddressSchema = zod_1.z.object(addressFields);
exports.updateAddressSchema = zod_1.z.object(addressFields).partial();
