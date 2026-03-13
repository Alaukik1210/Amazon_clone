"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSku = generateSku;
// Generates a unique SKU from the product title
// "Men's Running Shoes" → "MEN-RUN-SHO-K3X9Z1"
function generateSku(title) {
    const prefix = title
        .split(/\s+/)
        .slice(0, 3)
        .map((w) => w.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase())
        .join("-");
    const suffix = Date.now().toString(36).toUpperCase();
    return `${prefix}-${suffix}`;
}
