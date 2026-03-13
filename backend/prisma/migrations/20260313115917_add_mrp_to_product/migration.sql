-- Add mrp field to Product
ALTER TABLE "Product"
ADD COLUMN "mrp" DECIMAL(10,2);
