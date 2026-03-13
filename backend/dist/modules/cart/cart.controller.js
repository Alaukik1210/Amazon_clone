"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = getCart;
exports.addItem = addItem;
exports.updateItem = updateItem;
exports.removeItem = removeItem;
exports.clearCart = clearCart;
const cartService = __importStar(require("./cart.service"));
async function getCart(req, res, next) {
    try {
        const cart = await cartService.getCart(req.user.id);
        res.status(200).json({ success: true, data: cart });
    }
    catch (err) {
        next(err);
    }
}
async function addItem(req, res, next) {
    try {
        const cart = await cartService.addItem(req.user.id, req.body);
        res.status(200).json({ success: true, data: cart });
    }
    catch (err) {
        next(err);
    }
}
async function updateItem(req, res, next) {
    try {
        const cart = await cartService.updateItem(req.user.id, String(req.params.itemId), req.body.quantity);
        res.status(200).json({ success: true, data: cart });
    }
    catch (err) {
        next(err);
    }
}
async function removeItem(req, res, next) {
    try {
        const cart = await cartService.removeItem(req.user.id, String(req.params.itemId));
        res.status(200).json({ success: true, data: cart });
    }
    catch (err) {
        next(err);
    }
}
async function clearCart(req, res, next) {
    try {
        await cartService.clearCart(req.user.id);
        res.status(200).json({ success: true, message: "Cart cleared" });
    }
    catch (err) {
        next(err);
    }
}
