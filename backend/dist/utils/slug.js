"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSlug = toSlug;
// Converts a string to a URL-friendly slug
// "Men's Running Shoes!" → "mens-running-shoes"
function toSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}
