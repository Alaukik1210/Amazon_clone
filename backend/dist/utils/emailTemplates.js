"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOrderConfirmationEmail = buildOrderConfirmationEmail;
function buildOrderConfirmationEmail(data) {
    const { userName, orderId, createdAt, items, totalAmount, shippingAddress } = data;
    const itemRows = items
        .map((item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${item.product.title}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">₹${Number(item.price).toLocaleString("en-IN")}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">₹${(Number(item.price) * item.quantity).toLocaleString("en-IN")}</td>
      </tr>`)
        .join("");
    const address = `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postalCode}, ${shippingAddress.country}`;
    return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>Order Confirmation</title></head>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#ff9900;padding:24px 30px;">
              <h1 style="margin:0;color:#fff;font-size:24px;">🛒 Order Confirmed!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px;">
              <p style="font-size:16px;color:#333;">Hi <strong>${userName}</strong>,</p>
              <p style="color:#555;">Thank you for your order! We've received it and will begin processing soon.</p>

              <table width="100%" style="margin:20px 0;">
                <tr>
                  <td><strong>Order ID:</strong></td>
                  <td style="color:#555;">${orderId}</td>
                </tr>
                <tr>
                  <td><strong>Order Date:</strong></td>
                  <td style="color:#555;">${new Date(createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</td>
                </tr>
              </table>

              <!-- Items Table -->
              <h3 style="color:#333;border-bottom:2px solid #ff9900;padding-bottom:8px;">Order Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f9f9f9;">
                    <th style="padding:10px;text-align:left;color:#555;">Product</th>
                    <th style="padding:10px;text-align:center;color:#555;">Qty</th>
                    <th style="padding:10px;text-align:right;color:#555;">Unit Price</th>
                    <th style="padding:10px;text-align:right;color:#555;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding:12px 10px;text-align:right;font-weight:bold;font-size:16px;">Total</td>
                    <td style="padding:12px 10px;text-align:right;font-weight:bold;font-size:16px;color:#ff9900;">
                      ₹${Number(totalAmount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <!-- Shipping Address -->
              <h3 style="color:#333;border-bottom:2px solid #ff9900;padding-bottom:8px;margin-top:30px;">Shipping Address</h3>
              <p style="color:#555;line-height:1.6;">${address}</p>

              <p style="color:#888;font-size:14px;margin-top:30px;">
                You can track your order status by logging into your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f4;padding:20px 30px;text-align:center;">
              <p style="color:#aaa;font-size:12px;margin:0;">© ${new Date().getFullYear()} Amazon Clone. All rights reserved.</p>
            </td>
          </tr> 

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}
