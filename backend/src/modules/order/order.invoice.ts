import PDFDocument from "pdfkit";

type InvoiceItem = {
  title: string;
  quantity: number;
  unitPrice: string;
};

type InvoiceOrder = {
  id: string;
  createdAt: Date;
  paymentMode: string;
  paymentStatus: string;
  razorpayPaymentId: string | null;
  totalAmount: string;
  user: {
    name: string | null;
    email: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: InvoiceItem[];
};

function money(value: string | number) {
  return `INR ${Number(value).toFixed(2)}`;
}

function drawRow(
  doc: PDFKit.PDFDocument,
  y: number,
  cols: { item: string; qty: string; unit: string; total: string }
) {
  doc.font("Helvetica").fontSize(10).fillColor("#111827");
  doc.text(cols.item, 50, y, { width: 260 });
  doc.text(cols.qty, 325, y, { width: 50, align: "right" });
  doc.text(cols.unit, 385, y, { width: 75, align: "right" });
  doc.text(cols.total, 470, y, { width: 75, align: "right" });
}

export async function buildOrderInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  const pdf = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const invoiceNumber = `INV-${order.id.slice(-10).toUpperCase()}`;
  const invoiceDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(order.createdAt);

  doc.font("Helvetica-Bold").fontSize(22).fillColor("#0F1111").text("Tax Invoice", 50, 46);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#374151")
    .text("Amazon Clone Retail Pvt. Ltd.", 50, 78)
    .text("Bengaluru, Karnataka, India", 50, 92)
    .text("GSTIN: 29ABCDE1234F1Z5", 50, 106);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#111827")
    .text(`Invoice No: ${invoiceNumber}`, 360, 78, { align: "right" })
    .text(`Invoice Date: ${invoiceDate}`, 360, 92, { align: "right" })
    .text(`Order ID: ${order.id}`, 360, 106, { align: "right" });

  doc.moveTo(50, 132).lineTo(545, 132).strokeColor("#D1D5DB").stroke();

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Bill To", 50, 145);
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Ship To", 300, 145);

  const customerName = order.user.name?.trim() || "Customer";
  const billLines = [
    customerName,
    order.user.email,
    order.shippingAddress.street,
    `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`,
    order.shippingAddress.country,
  ];

  let billY = 160;
  for (const line of billLines) {
    doc.font("Helvetica").fontSize(10).fillColor("#374151").text(line, 50, billY, { width: 220 });
    billY += 14;
  }

  let shipY = 160;
  for (const line of billLines) {
    doc.font("Helvetica").fontSize(10).fillColor("#374151").text(line, 300, shipY, { width: 220 });
    shipY += 14;
  }

  const tableTop = Math.max(billY, shipY) + 16;

  doc.rect(50, tableTop, 495, 24).fill("#F3F4F6");
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827");
  doc.text("Item", 50, tableTop + 7, { width: 260 });
  doc.text("Qty", 325, tableTop + 7, { width: 50, align: "right" });
  doc.text("Unit Price", 385, tableTop + 7, { width: 75, align: "right" });
  doc.text("Amount", 470, tableTop + 7, { width: 75, align: "right" });

  let y = tableTop + 30;
  let subtotal = 0;

  for (const item of order.items) {
    const lineTotal = Number(item.unitPrice) * item.quantity;
    subtotal += lineTotal;
    drawRow(doc, y, {
      item: item.title,
      qty: String(item.quantity),
      unit: money(item.unitPrice),
      total: money(lineTotal),
    });
    y += 22;

    if (y > 700) {
      doc.addPage();
      y = 60;
    }
  }

  y += 8;
  doc.moveTo(320, y).lineTo(545, y).strokeColor("#D1D5DB").stroke();
  y += 10;

  doc.font("Helvetica").fontSize(10).fillColor("#374151");
  doc.text("Subtotal", 380, y, { width: 80, align: "right" });
  doc.text(money(subtotal), 470, y, { width: 75, align: "right" });
  y += 16;

  doc.text("Shipping", 380, y, { width: 80, align: "right" });
  doc.text("INR 0.00", 470, y, { width: 75, align: "right" });
  y += 16;

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827");
  doc.text("Grand Total", 380, y, { width: 80, align: "right" });
  doc.text(money(order.totalAmount), 470, y, { width: 75, align: "right" });
  y += 24;

  doc.font("Helvetica").fontSize(10).fillColor("#374151");
  doc.text(`Payment Mode: ${order.paymentMode}`, 50, y);
  y += 14;
  doc.text(`Payment Status: ${order.paymentStatus}`, 50, y);
  if (order.razorpayPaymentId) {
    y += 14;
    doc.text(`Payment Reference: ${order.razorpayPaymentId}`, 50, y);
  }

  doc.font("Helvetica").fontSize(9).fillColor("#6B7280").text(
    "This is a computer-generated invoice and does not require a physical signature.",
    50,
    780,
    { width: 495, align: "center" }
  );

  doc.end();
  return pdf;
}
