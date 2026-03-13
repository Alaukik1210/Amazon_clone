import { PrismaClient, ProductStatus, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ───────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function makeSku(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean in dependency order ──────────────────────────────────────────
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // ── Default User ────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);

  const defaultUser = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'user@amazon-clone.com',
      password: hashedPassword,
      phone: '9876543210',
      role: Role.CUSTOMER,
      isEmailVerified: true,
    },
  });
  console.log('✅ Default user:', defaultUser.email);

  // Admin user
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@amazon-clone.com',
      password: await bcrypt.hash('admin123', 10),
      phone: '9000000000',
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });
  console.log('✅ Admin user:', adminUser.email);

  // ── Default Address ─────────────────────────────────────────────────────
  await prisma.address.create({
    data: {
      userId: defaultUser.id,
      street: '12, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
      isDefault: true,
    },
  });
  console.log('✅ Default address seeded');

  // ── Categories ──────────────────────────────────────────────────────────
  const [electronics, fashion, homeFurniture, books, sports, beauty] =
    await Promise.all([
      prisma.category.upsert({
        where: { slug: 'electronics' },
        update: {},
        create: {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Mobiles, Laptops, TVs, Cameras and more',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'fashion' },
        update: {},
        create: {
          name: 'Fashion',
          slug: 'fashion',
          description: 'Clothing, Footwear, Accessories and more',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'home-furniture' },
        update: {},
        create: {
          name: 'Home & Furniture',
          slug: 'home-furniture',
          description: 'Furniture, Kitchen, Bedding and more',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'books' },
        update: {},
        create: {
          name: 'Books',
          slug: 'books',
          description: 'Fiction, Non-Fiction, Technical and more',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'sports' },
        update: {},
        create: {
          name: 'Sports & Fitness',
          slug: 'sports',
          description: 'Equipment, Supplements, Activewear and more',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'beauty' },
        update: {},
        create: {
          name: 'Beauty & Care',
          slug: 'beauty',
          description: 'Skincare, Haircare, Makeup and more',
        },
      }),
    ]);

  console.log('✅ Categories seeded');

  // ── Products ─────────────────────────────────────────────────────────────
  // NOTE: Fields mapped from original seed →
  //   name        → title
  //   rating      → avgRating
  //   images[]    → ProductImage records (separate model)
  //   sku         → generated (required, unique)
  //   slug        → generated (required, unique)
  //   status      → ProductStatus.ACTIVE (default)
  //   brand / mrp / isFeatured / specifications → not in schema, dropped

  type ProductSeed = {
    title: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    avgRating: number;
    reviewCount: number;
    images: string[];
  };

  const products: ProductSeed[] = [

    // ════════════════════════════════════
    // ELECTRONICS — 35 products
    // ════════════════════════════════════
    {
      title: 'Samsung Galaxy S24 Ultra',
      description: 'Flagship Android smartphone with 200MP camera, S-Pen, and Snapdragon 8 Gen 3. 12GB RAM, 256GB storage.',
      price: 109999, stock: 25, categoryId: electronics.id,
      avgRating: 4.5, reviewCount: 3421,
      images: [
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',
        'https://images.unsplash.com/photo-1574920162043-b872873f19c8?w=500',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500',
      ],
    },
    {
      title: 'Apple iPhone 15 Pro',
      description: 'Apple iPhone 15 Pro with A17 Pro chip, titanium design, 48MP camera system, and USB-C.',
      price: 134900, stock: 18, categoryId: electronics.id,
      avgRating: 4.7, reviewCount: 5210,
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500',
        'https://images.unsplash.com/photo-1565536421961-1a462c1d9e11?w=500',
      ],
    },
    {
      title: 'Apple iPhone 15',
      description: 'Apple iPhone 15 with A16 Bionic chip, 48MP camera, Dynamic Island, and USB-C charging.',
      price: 79999, stock: 20, categoryId: electronics.id,
      avgRating: 4.6, reviewCount: 4890,
      images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500'],
    },
    {
      title: 'OnePlus 12 5G',
      description: 'OnePlus 12 with Snapdragon 8 Gen 3, Hasselblad triple camera, 100W SUPERVOOC charging.',
      price: 64999, stock: 40, categoryId: electronics.id,
      avgRating: 4.5, reviewCount: 8920,
      images: ['https://images.unsplash.com/photo-1574920162043-b872873f19c8?w=500'],
    },
    {
      title: 'Redmi Note 13 Pro 5G',
      description: '200MP OIS camera, 120Hz AMOLED display, 5100mAh battery with 67W fast charging.',
      price: 23999, stock: 60, categoryId: electronics.id,
      avgRating: 4.4, reviewCount: 12500,
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'],
    },
    {
      title: 'Samsung Galaxy A54 5G',
      description: 'Samsung Galaxy A54 with 50MP OIS camera, 5000mAh battery, and IP67 water resistance.',
      price: 38999, stock: 50, categoryId: electronics.id,
      avgRating: 4.3, reviewCount: 18700,
      images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500'],
    },
    {
      title: 'boAt Airdopes 141 TWS',
      description: 'True wireless earbuds with 42H total playback, BEAST Mode low latency, IPX4 water resistance.',
      price: 999, stock: 200, categoryId: electronics.id,
      avgRating: 4.1, reviewCount: 89432,
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'],
    },
    {
      title: 'Sony WH-1000XM5 Headphones',
      description: 'Industry-leading noise canceling headphones with 30hr battery and multipoint connection.',
      price: 24990, stock: 35, categoryId: electronics.id,
      avgRating: 4.7, reviewCount: 4312,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500',
        'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500',
        'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=500',
      ],
    },
    {
      title: 'Lenovo IdeaPad Slim 3 Laptop',
      description: 'Thin & light laptop with Intel Core i5 12th Gen, 16GB RAM, 512GB SSD, Full HD display.',
      price: 54990, stock: 14, categoryId: electronics.id,
      avgRating: 4.3, reviewCount: 2180,
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'],
    },
    {
      title: 'Apple MacBook Air M2',
      description: 'MacBook Air with M2 chip, 13.6-inch Liquid Retina display, and up to 18 hours battery.',
      price: 99900, stock: 20, categoryId: electronics.id,
      avgRating: 4.8, reviewCount: 9870,
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        'https://images.unsplash.com/photo-1611186871525-9c4e4a45ad3e?w=500',
        'https://images.unsplash.com/photo-1602080858428-57174f9431cf?w=500',
      ],
    },
    {
      title: 'HP Pavilion Gaming 15 Laptop',
      description: 'HP Pavilion Gaming with AMD Ryzen 5, NVIDIA GTX 1650, 144Hz display, and 8GB RAM.',
      price: 54990, stock: 12, categoryId: electronics.id,
      avgRating: 4.2, reviewCount: 6710,
      images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500'],
    },
    {
      title: 'ASUS ROG Strix G15 Gaming Laptop',
      description: 'ASUS ROG Strix G15 with AMD Ryzen 9, RTX 3070, and 300Hz display for ultimate gaming.',
      price: 119990, stock: 8, categoryId: electronics.id,
      avgRating: 4.6, reviewCount: 3200,
      images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500'],
    },
    {
      title: 'Samsung 55" 4K QLED Smart TV',
      description: 'Samsung QLED TV with Quantum Processor 4K, Motion Xcelerator, and Tizen OS.',
      price: 54990, stock: 20, categoryId: electronics.id,
      avgRating: 4.4, reviewCount: 7820,
      images: [
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=500',
        'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500',
        'https://images.unsplash.com/photo-1548921441-89c8bd86ffb7?w=500',
        'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=500',
      ],
    },
    {
      title: 'LG 43" Full HD Smart TV',
      description: 'LG Full HD Smart TV with Active HDR, WebOS, and built-in Alexa voice assistant.',
      price: 22990, stock: 30, categoryId: electronics.id,
      avgRating: 4.2, reviewCount: 12300,
      images: ['https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500'],
    },
    {
      title: 'Sony PlayStation 5 Console',
      description: 'PS5 with ultra-high speed SSD, ray tracing, and 4K gaming at up to 120fps.',
      price: 49990, stock: 5, categoryId: electronics.id,
      avgRating: 4.8, reviewCount: 28700,
      images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500'],
    },
    {
      title: 'Canon EOS R50 Mirrorless Camera',
      description: 'Canon EOS R50 with 24.2MP APS-C sensor, 4K video, and compact lightweight body.',
      price: 64995, stock: 12, categoryId: electronics.id,
      avgRating: 4.5, reviewCount: 2340,
      images: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
        'https://images.unsplash.com/photo-1502920917128-1aa500764bea?w=500',
        'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=500',
        'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=500',
      ],
    },
    {
      title: 'JBL Charge 5 Portable Speaker',
      description: 'JBL Charge 5 with 20 hours playtime, IP67 waterproof, and PartyBoost connectivity.',
      price: 13999, stock: 65, categoryId: electronics.id,
      avgRating: 4.5, reviewCount: 14300,
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'],
    },
    {
      title: 'Apple Watch Series 9 GPS 45mm',
      description: 'Apple Watch Series 9 with S9 chip, double tap gesture, and carbon neutral design.',
      price: 44900, stock: 40, categoryId: electronics.id,
      avgRating: 4.6, reviewCount: 11200,
      images: [
        'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=500',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=500',
        'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500',
      ],
    },
    {
      title: 'Xiaomi Smart Band 8 Pro',
      description: 'Xiaomi Smart Band 8 Pro with 1.74" AMOLED display, built-in GPS, and 150+ workout modes.',
      price: 3999, stock: 150, categoryId: electronics.id,
      avgRating: 4.1, reviewCount: 22100,
      images: ['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500'],
    },
    {
      title: 'Noise ColorFit Pro 5 Smartwatch',
      description: 'Noise smartwatch with 1.46" AMOLED, Bluetooth calling, and 100+ sports modes.',
      price: 2499, stock: 180, categoryId: electronics.id,
      avgRating: 3.9, reviewCount: 31200,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
    },
    {
      title: 'Logitech MX Master 3S Wireless Mouse',
      description: 'Logitech MX Master 3S with 8K DPI sensor, MagSpeed scroll wheel, and silent clicks.',
      price: 7495, stock: 90, categoryId: electronics.id,
      avgRating: 4.7, reviewCount: 8900,
      images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500'],
    },
    {
      title: 'Samsung 980 PRO 1TB NVMe SSD',
      description: 'Samsung 980 PRO PCIe 4.0 NVMe SSD with 7000MB/s sequential read speed.',
      price: 8999, stock: 75, categoryId: electronics.id,
      avgRating: 4.7, reviewCount: 19800,
      images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500'],
    },
    {
      title: 'WD 1TB My Passport Portable HDD',
      description: 'WD My Passport 1TB with USB 3.0, hardware encryption, and auto backup software.',
      price: 3299, stock: 110, categoryId: electronics.id,
      avgRating: 4.3, reviewCount: 34500,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    },
    {
      title: 'Prestige Induction Cooktop 1600W',
      description: 'Slim induction cooktop with 8 preset menus, auto-off, child lock, and Indian menu presets.',
      price: 1999, stock: 80, categoryId: electronics.id,
      avgRating: 4.3, reviewCount: 22100,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
    },
    {
      title: 'Bajaj Majesty RCX 3 Air Cooler 36L',
      description: '36L tower air cooler with 3-speed control, auto-fill feature, and ice chamber.',
      price: 8499, stock: 45, categoryId: electronics.id,
      avgRating: 4.2, reviewCount: 3210,
      images: ['https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=500'],
    },
    {
      title: 'Anker 65W GaN USB-C Charger 3-Port',
      description: 'Compact 65W GaN charger with 3 ports — charges laptop and phone simultaneously.',
      price: 2499, stock: 200, categoryId: electronics.id,
      avgRating: 4.5, reviewCount: 12400,
      images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500'],
    },
    {
      title: 'Realme Pad 2 Tablet 8GB 128GB',
      description: 'Realme Pad 2 with 11.5" 2K 120Hz display, Unisoc T616, and Dolby Atmos quad speakers.',
      price: 17999, stock: 35, categoryId: electronics.id,
      avgRating: 4.1, reviewCount: 4500,
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500'],
    },
    {
      title: 'iQOO Neo 9 Pro 5G 256GB',
      description: 'iQOO Neo 9 Pro with Snapdragon 8 Gen 2, 144Hz AMOLED, and 120W FlashCharge.',
      price: 36999, stock: 50, categoryId: electronics.id,
      avgRating: 4.4, reviewCount: 9800,
      images: ['https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500'],
    },
    {
      title: 'DJI Mini 3 Drone',
      description: 'DJI Mini 3 with 4K/60fps video, 38-minute flight time, and obstacle sensing.',
      price: 54900, stock: 8, categoryId: electronics.id,
      avgRating: 4.6, reviewCount: 1890,
      images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500'],
    },
    {
      title: 'Mi Smart Air Purifier 4 Pro',
      description: 'Xiaomi Air Purifier 4 Pro with True HEPA filter, 500m³/h CADR, and Mi Home app control.',
      price: 11999, stock: 40, categoryId: electronics.id,
      avgRating: 4.3, reviewCount: 8900,
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500'],
    },
    {
      title: 'boAt Stone 352 Bluetooth Speaker',
      description: '10W portable speaker with 12 hours playback, IPX7 waterproof, and 360° sound.',
      price: 1199, stock: 220, categoryId: electronics.id,
      avgRating: 3.9, reviewCount: 67800,
      images: ['https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?w=500'],
    },
    {
      title: 'Voltas 1.5 Ton 5 Star Split AC',
      description: 'Voltas 5-star inverter split AC with adjustable cooling and anti-dust filter.',
      price: 34990, stock: 15, categoryId: electronics.id,
      avgRating: 4.1, reviewCount: 5600,
      images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500'],
    },
    {
      title: 'Razer DeathAdder V3 Pro Gaming Mouse',
      description: 'Razer DeathAdder V3 Pro wireless gaming mouse with Focus Pro 30K optical sensor.',
      price: 11999, stock: 30, categoryId: electronics.id,
      avgRating: 4.6, reviewCount: 4500,
      images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500'],
    },
    {
      title: 'Seagate Barracuda 2TB Internal HDD',
      description: 'Seagate Barracuda 2TB SATA HDD with 7200 RPM and 256MB cache for desktops.',
      price: 3999, stock: 85, categoryId: electronics.id,
      avgRating: 4.4, reviewCount: 28900,
      images: ['https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500'],
    },

    // ════════════════════════════════════
    // FASHION — 25 products
    // ════════════════════════════════════
    {
      title: 'Campus OG-07 Casual Sneakers Men',
      description: 'Classic casual sneakers with PVC outer material, cushioned insole, and rubber sole.',
      price: 668, stock: 90, categoryId: fashion.id,
      avgRating: 3.5, reviewCount: 2877,
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
    },
    {
      title: "Levi's 511 Slim Fit Jeans Dark Blue",
      description: "Classic slim fit jeans with stretch fabric, 5-pocket styling, and iconic Levi's red tab.",
      price: 2099, stock: 75, categoryId: fashion.id,
      avgRating: 4.4, reviewCount: 8920,
      images: [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=500',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500',
        'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=500',
      ],
    },
    {
      title: 'Allen Solly Regular Fit Polo T-Shirt',
      description: 'Premium cotton polo T-shirt with ribbed collar, half sleeves, and regular fit.',
      price: 699, stock: 150, categoryId: fashion.id,
      avgRating: 4.2, reviewCount: 5430,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
    },
    {
      title: 'Nike Air Force 1 07 Sneakers White',
      description: 'Nike Air Force 1 classic low-top with Air cushioning and perforated leather toe box.',
      price: 7495, stock: 80, categoryId: fashion.id,
      avgRating: 4.5, reviewCount: 45600,
      images: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500',
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500',
      ],
    },
    {
      title: 'Puma Running Sports Shoes Men',
      description: 'Lightweight running shoes with SOFTFOAM+ cushioning, mesh upper, and non-marking outsole.',
      price: 2299, stock: 40, categoryId: fashion.id,
      avgRating: 4.3, reviewCount: 6780,
      images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500'],
    },
    {
      title: 'BELLAVITA Mystic Bloom Perfume 60ml',
      description: 'Luxurious Eau de Parfum with notes of jasmine, rose, and musk. Long-lasting 60ml bottle.',
      price: 499, stock: 200, categoryId: fashion.id,
      avgRating: 4.0, reviewCount: 9800,
      images: ['https://images.unsplash.com/photo-1541643600914-78b084683702?w=500'],
    },
    {
      title: 'Adidas Originals Track Jacket Women',
      description: 'Adidas Originals track jacket with 3-stripe design and tricot fabric.',
      price: 2799, stock: 90, categoryId: fashion.id,
      avgRating: 4.3, reviewCount: 12300,
      images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500'],
    },
    {
      title: "W Women's A-Line Kurta Set Pink",
      description: 'W ethnic kurta set with floral print, A-line silhouette, and matching dupatta.',
      price: 1199, stock: 100, categoryId: fashion.id,
      avgRating: 4.1, reviewCount: 18700,
      images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500'],
    },
    {
      title: 'Ray-Ban Wayfarer Classic Sunglasses',
      description: 'Ray-Ban RB2140 Wayfarer with acetate frame and G-15 crystal UV400 lenses.',
      price: 5790, stock: 40, categoryId: fashion.id,
      avgRating: 4.6, reviewCount: 15600,
      images: [
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500',
        'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=500',
        'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=500',
      ],
    },
    {
      title: 'Fastrack Analog Watch for Men',
      description: 'Fastrack analog watch with stainless steel case, mesh strap, and water resistance.',
      price: 1295, stock: 75, categoryId: fashion.id,
      avgRating: 4.0, reviewCount: 29800,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
    },
    {
      title: "H&M Women's Floral Wrap Dress",
      description: 'H&M wrap dress in woven fabric with floral print and self-tie belt.',
      price: 1299, stock: 60, categoryId: fashion.id,
      avgRating: 4.1, reviewCount: 8900,
      images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500'],
    },
    {
      title: 'Wildcraft Nitro 25L Backpack Teal',
      description: 'Wildcraft Nitro 25L backpack with laptop compartment and rain cover.',
      price: 1299, stock: 70, categoryId: fashion.id,
      avgRating: 4.0, reviewCount: 13400,
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
    },
    {
      title: "U.S. Polo Assn. Men's Polo T-Shirt Navy",
      description: 'US Polo ASSN classic polo in pique cotton with embroidered logo.',
      price: 699, stock: 200, categoryId: fashion.id,
      avgRating: 4.2, reviewCount: 41200,
      images: ['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500'],
    },
    {
      title: "Biba Women's Anarkali Suit Set",
      description: 'Biba anarkali suit with cotton fabric, printed pattern, and straight pants.',
      price: 1599, stock: 75, categoryId: fashion.id,
      avgRating: 4.0, reviewCount: 12100,
      images: ['https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500'],
    },
    {
      title: "Woodland Men's Hiking Boots Brown",
      description: 'Woodland high-ankle hiking boots with waterproof leather and grip sole.',
      price: 3499, stock: 60, categoryId: fashion.id,
      avgRating: 4.1, reviewCount: 24500,
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
    },
    {
      title: "Tommy Hilfiger Men's Leather Belt",
      description: 'Tommy Hilfiger genuine leather belt with classic logo buckle.',
      price: 1299, stock: 100, categoryId: fashion.id,
      avgRating: 4.4, reviewCount: 19800,
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
    },
    {
      title: 'Crocs Classic Clog Navy Blue',
      description: 'Crocs Classic Clog with Croslite foam construction and pivoting heel strap.',
      price: 2799, stock: 110, categoryId: fashion.id,
      avgRating: 4.4, reviewCount: 38900,
      images: ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500'],
    },
    {
      title: 'Skechers Go Walk 6 Slip-On Shoes',
      description: 'Skechers GOwalk 6 with Air-Cooled Goga Mat insole and Ultra Go cushioning.',
      price: 2999, stock: 85, categoryId: fashion.id,
      avgRating: 4.3, reviewCount: 31200,
      images: ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500'],
    },
    {
      title: "Mango Women's Single-Breasted Blazer Black",
      description: 'Mango single-breasted blazer in crepe fabric with padded shoulders.',
      price: 4290, stock: 35, categoryId: fashion.id,
      avgRating: 4.4, reviewCount: 5600,
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4d8e?w=500'],
    },
    {
      title: "Van Heusen Men's Formal Trousers Grey",
      description: 'Van Heusen flat-front formal trousers in wrinkle-resistant polyester blend.',
      price: 1299, stock: 90, categoryId: fashion.id,
      avgRating: 4.1, reviewCount: 14300,
      images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500'],
    },
    {
      title: "Global Desi Women's Printed Maxi Skirt",
      description: 'Global Desi tiered maxi skirt with ethnic print and elastic waistband.',
      price: 899, stock: 65, categoryId: fashion.id,
      avgRating: 3.9, reviewCount: 8900,
      images: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500'],
    },
    {
      title: "HRX Men's Compression Shorts",
      description: 'HRX compression shorts with 4-way stretch and quick-dry fabric for gym use.',
      price: 499, stock: 180, categoryId: fashion.id,
      avgRating: 4.1, reviewCount: 16700,
      images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500'],
    },
    {
      title: "Baggit Women's Structured Tote Bag Brown",
      description: 'Baggit structured tote in vegan leather with multiple compartments and zip top.',
      price: 1499, stock: 55, categoryId: fashion.id,
      avgRating: 4.2, reviewCount: 9800,
      images: ['https://images.unsplash.com/photo-1548036328-c375907d081c?w=500'],
    },
    {
      title: 'Arrow Men Two-Piece Suit Charcoal',
      description: 'Arrow premium wool blend two-piece suit with full-lined blazer and flat-front trousers.',
      price: 5999, stock: 20, categoryId: fashion.id,
      avgRating: 4.3, reviewCount: 4500,
      images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500'],
    },
    {
      title: 'Reebok Nano X3 Cross-Training Shoes',
      description: 'Reebok Nano X3 with Floatride Energy Foam for superior cross-training performance.',
      price: 6999, stock: 40, categoryId: fashion.id,
      avgRating: 4.4, reviewCount: 6700,
      images: ['https://images.unsplash.com/photo-1539185441755-769473a23570?w=500'],
    },

    // ════════════════════════════════════
    // HOME & FURNITURE — 20 products
    // ════════════════════════════════════
    {
      title: 'Solimo Microfiber Comforter Double',
      description: 'All-season 300 GSM microfiber comforter, soft shell fabric, machine washable.',
      price: 999, stock: 95, categoryId: homeFurniture.id,
      avgRating: 4.3, reviewCount: 31200,
      images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500'],
    },
    {
      title: 'Pigeon Healthifry 4L Digital Air Fryer',
      description: '4.2L digital air fryer with 8 preset programs, rapid air technology.',
      price: 3299, stock: 55, categoryId: homeFurniture.id,
      avgRating: 4.4, reviewCount: 14300,
      images: [
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
        'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
        'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=500',
      ],
    },
    {
      title: 'Nilkamal Plastic Dining Chair Set of 4',
      description: 'Durable plastic chairs with ergonomic design, stackable, UV-resistant. Supports 150kg.',
      price: 2199, stock: 50, categoryId: homeFurniture.id,
      avgRating: 4.1, reviewCount: 7600,
      images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=500'],
    },
    {
      title: 'Prestige Svachh 5L Pressure Cooker',
      description: 'Prestige aluminium pressure cooker with gasket release system and safety valve.',
      price: 1199, stock: 120, categoryId: homeFurniture.id,
      avgRating: 4.3, reviewCount: 56700,
      images: ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500'],
    },
    {
      title: 'Philips Amaze 1000W Mixer Grinder 3 Jars',
      description: 'Philips Amaze mixer grinder with 1000W motor and 3 stainless steel jars.',
      price: 2499, stock: 80, categoryId: homeFurniture.id,
      avgRating: 4.2, reviewCount: 23400,
      images: ['https://images.unsplash.com/photo-1593759608142-e976b96b2cd3?w=500'],
    },
    {
      title: 'Wakefit Orthopedic Memory Foam Mattress Queen',
      description: 'Wakefit 6-inch orthopedic mattress with memory foam top layer for pressure relief.',
      price: 11999, stock: 30, categoryId: homeFurniture.id,
      avgRating: 4.4, reviewCount: 34500,
      images: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=500',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500',
      ],
    },
    {
      title: 'Bosch 7kg Front Load Washing Machine',
      description: 'Bosch WAJ2846WIN with EcoSilence Drive motor and i-DOS automatic dosing system.',
      price: 34990, stock: 15, categoryId: homeFurniture.id,
      avgRating: 4.4, reviewCount: 8900,
      images: [
        'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=500',
        'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=500',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500',
      ],
    },
    {
      title: 'Milton Thermosteel Flip Lid Flask 1L',
      description: 'Milton stainless steel flask keeps hot/cold for 24 hours, leak-proof flip lid.',
      price: 549, stock: 250, categoryId: homeFurniture.id,
      avgRating: 4.4, reviewCount: 89000,
      images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    },
    {
      title: 'Hettich WoodPecker Study Table with Drawer',
      description: 'Engineered wood study table with drawer and cable management hole.',
      price: 6999, stock: 25, categoryId: homeFurniture.id,
      avgRating: 4.3, reviewCount: 4500,
      images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500'],
    },
    {
      title: 'IFB 20L Convection Microwave Oven',
      description: 'IFB microwave with convection, grill, and 71 autocook menus.',
      price: 9990, stock: 35, categoryId: homeFurniture.id,
      avgRating: 4.3, reviewCount: 14500,
      images: ['https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500'],
    },
    {
      title: 'Hawkins Contura 3L Pressure Cooker',
      description: 'Hawkins hard-anodised contura pressure cooker with cool-touch handle.',
      price: 2195, stock: 75, categoryId: homeFurniture.id,
      avgRating: 4.5, reviewCount: 31200,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
    },
    {
      title: 'Faber 90cm Wall Mounted Kitchen Chimney',
      description: 'Faber chimney with 1200m³/hr suction, baffle filter, and touch + motion sensor.',
      price: 12999, stock: 22, categoryId: homeFurniture.id,
      avgRating: 4.1, reviewCount: 6700,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
    },
    {
      title: 'Dyson V12 Detect Slim Cordless Vacuum',
      description: 'Dyson V12 with laser dust detection, 60-minute runtime, and HEPA filtration.',
      price: 44900, stock: 8, categoryId: homeFurniture.id,
      avgRating: 4.6, reviewCount: 2340,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    },
    {
      title: 'Solimo 400 GSM Cotton Bath Towels Set of 4',
      description: 'Ultra-absorbent quick-dry cotton towel set, 400 GSM.',
      price: 599, stock: 200, categoryId: homeFurniture.id,
      avgRating: 4.1, reviewCount: 45600,
      images: ['https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500'],
    },
    {
      title: 'Usha Aeroline Table Fan 400mm',
      description: 'Usha table fan with 3-speed settings, 100% copper motor, and anti-dust blade.',
      price: 1299, stock: 100, categoryId: homeFurniture.id,
      avgRating: 4.1, reviewCount: 19800,
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500'],
    },
    {
      title: 'Godrej Interio Slimline Steel Almirah 2 Door',
      description: 'Godrej steel almirah with 2 doors, adjustable shelves, and powder coat finish.',
      price: 8999, stock: 20, categoryId: homeFurniture.id,
      avgRating: 4.2, reviewCount: 7800,
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500'],
    },
    {
      title: 'Story@Home Anti-Slip Bath Mat Set of 2',
      description: 'Anti-skid bath mat with micro-polyester and TPR non-slip backing.',
      price: 399, stock: 300, categoryId: homeFurniture.id,
      avgRating: 4.0, reviewCount: 23400,
      images: ['https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=500'],
    },
    {
      title: 'Bajaj Majesty 1900W Induction Cooktop',
      description: 'Bajaj induction cooktop with 8 preset menus, digital display, and auto-off.',
      price: 1299, stock: 90, categoryId: homeFurniture.id,
      avgRating: 4.1, reviewCount: 34500,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
    },
    {
      title: 'Pepperfry Engineered Wood Bookshelf 5 Shelves',
      description: 'Pepperfry 5-shelf bookcase in wenge finish, easy DIY assembly.',
      price: 4499, stock: 28, categoryId: homeFurniture.id,
      avgRating: 4.0, reviewCount: 5600,
      images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500'],
    },
    {
      title: 'Cello Checkers Plastic Stool Set of 2',
      description: 'Cello stackable plastic stool, UV-stabilized, easy to clean and store.',
      price: 799, stock: 120, categoryId: homeFurniture.id,
      avgRating: 3.9, reviewCount: 11200,
      images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500'],
    },

    // ════════════════════════════════════
    // BOOKS — 15 products
    // ════════════════════════════════════
    {
      title: 'Clean Code by Robert C. Martin',
      description: 'A handbook of agile software craftsmanship. Learn to write readable and maintainable code.',
      price: 499, stock: 300, categoryId: books.id,
      avgRating: 4.7, reviewCount: 12000,
      images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'],
    },
    {
      title: 'The Alchemist by Paulo Coelho',
      description: "Paulo Coelho's masterpiece about following your dreams. Over 65 million copies sold worldwide.",
      price: 199, stock: 500, categoryId: books.id,
      avgRating: 4.6, reviewCount: 45000,
      images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500'],
    },
    {
      title: 'System Design Interview Vol 2 by Alex Xu',
      description: "An insider's guide to system design interviews covering distributed systems and scalability.",
      price: 2499, stock: 80, categoryId: books.id,
      avgRating: 4.8, reviewCount: 3400,
      images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500'],
    },
    {
      title: 'Atomic Habits by James Clear',
      description: "James Clear's #1 New York Times bestseller on building good habits and breaking bad ones.",
      price: 499, stock: 200, categoryId: books.id,
      avgRating: 4.8, reviewCount: 89000,
      images: [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
        'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
        'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=500',
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500',
      ],
    },
    {
      title: 'Rich Dad Poor Dad by Robert Kiyosaki',
      description: 'The #1 personal finance book of all time — teaches financial literacy and investing mindset.',
      price: 299, stock: 300, categoryId: books.id,
      avgRating: 4.7, reviewCount: 124000,
      images: [
        'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500',
        'https://images.unsplash.com/photo-1565116175827-965e6f5b3c6d?w=500',
        'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
      ],
    },
    {
      title: 'The Psychology of Money by Morgan Housel',
      description: 'Timeless lessons on wealth, greed, and happiness through 19 short stories.',
      price: 299, stock: 280, categoryId: books.id,
      avgRating: 4.6, reviewCount: 56700,
      images: ['https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500'],
    },
    {
      title: "Harry Potter and the Sorcerer's Stone",
      description: "J.K. Rowling's first Harry Potter book — the one that started it all.",
      price: 499, stock: 250, categoryId: books.id,
      avgRating: 4.8, reviewCount: 145000,
      images: ['https://images.unsplash.com/photo-1618666012174-83b441c0bc76?w=500'],
    },
    {
      title: 'Zero to One by Peter Thiel',
      description: 'Notes on startups, or how to build the future. Essential reading for entrepreneurs.',
      price: 349, stock: 200, categoryId: books.id,
      avgRating: 4.4, reviewCount: 34500,
      images: ['https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=500'],
    },
    {
      title: 'Wings of Fire by APJ Abdul Kalam',
      description: "Autobiography of India's Missile Man and former President Dr. APJ Abdul Kalam.",
      price: 149, stock: 500, categoryId: books.id,
      avgRating: 4.7, reviewCount: 112000,
      images: ['https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500'],
    },
    {
      title: 'Deep Work by Cal Newport',
      description: 'Rules for focused success in a distracted world — a career transforming guide.',
      price: 449, stock: 180, categoryId: books.id,
      avgRating: 4.5, reviewCount: 29000,
      images: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500'],
    },
    {
      title: 'Ikigai The Japanese Secret to a Long Life',
      description: 'The Japanese concept of finding purpose — between passion, mission, and vocation.',
      price: 199, stock: 300, categoryId: books.id,
      avgRating: 4.4, reviewCount: 67800,
      images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500'],
    },
    {
      title: 'Sapiens A Brief History of Humankind',
      description: "Yuval Noah Harari's groundbreaking exploration of how Homo sapiens came to rule the world.",
      price: 499, stock: 190, categoryId: books.id,
      avgRating: 4.6, reviewCount: 78900,
      images: ['https://images.unsplash.com/photo-1494949360228-4e9f9a435e74?w=500'],
    },
    {
      title: 'The 5 AM Club by Robin Sharma',
      description: "Own your morning, elevate your life — Robin Sharma's morning routine guide.",
      price: 299, stock: 220, categoryId: books.id,
      avgRating: 4.2, reviewCount: 41200,
      images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500'],
    },
    {
      title: 'The Lean Startup by Eric Ries',
      description: "How today's entrepreneurs use continuous innovation to create successful businesses.",
      price: 399, stock: 160, categoryId: books.id,
      avgRating: 4.3, reviewCount: 23400,
      images: ['https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?w=500'],
    },
    {
      title: 'The 7 Habits of Highly Effective People',
      description: "Stephen Covey's timeless classic on personal and professional effectiveness.",
      price: 449, stock: 230, categoryId: books.id,
      avgRating: 4.5, reviewCount: 89000,
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
    },

    // ════════════════════════════════════
    // SPORTS & FITNESS — 15 products
    // ════════════════════════════════════
    {
      title: 'Boldfit Heavy Duty Gym Gloves',
      description: 'Neoprene padded gym gloves with full palm protection, adjustable wrist strap, and anti-slip grip.',
      price: 399, stock: 250, categoryId: sports.id,
      avgRating: 4.2, reviewCount: 34500,
      images: [
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500',
        'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=500',
      ],
    },
    {
      title: 'Yonex Voltric 1 DG Badminton Racket',
      description: 'Yonex Voltric 1 DG with isometric head, graphite shaft, and tri-voltage system for powerful smashes.',
      price: 2299, stock: 90, categoryId: sports.id,
      avgRating: 4.4, reviewCount: 18700,
      images: [
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
        'https://images.unsplash.com/photo-1616279969856-759f316a5ac1?w=500',
        'https://images.unsplash.com/photo-1592656094267-764a45160876?w=500',
        'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=500',
      ],
    },
    {
      title: 'Boldfit Anti-Slip TPE Yoga Mat 6mm',
      description: 'Anti-slip 6mm yoga mat with alignment lines and carrying strap.',
      price: 599, stock: 180, categoryId: sports.id,
      avgRating: 4.3, reviewCount: 18900,
      images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500'],
    },
    {
      title: 'Strauss Adjustable Rubber Dumbbell Set 2kg x2',
      description: 'Pair of rubber-coated dumbbells with chrome handle for home gym use.',
      price: 999, stock: 90, categoryId: sports.id,
      avgRating: 4.2, reviewCount: 7800,
      images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500'],
    },
    {
      title: 'Nivia Dominator Football Size 5',
      description: 'Official size 5 football with 32-panel machine-stitched design and high-air retention bladder.',
      price: 599, stock: 120, categoryId: sports.id,
      avgRating: 4.1, reviewCount: 5600,
      images: ['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=500'],
    },
    {
      title: 'Yonex Arcsaber 11 Pro Badminton Racket',
      description: 'Yonex Arcsaber 11 Pro with Rotational Generator System and lightweight 3U graphite frame.',
      price: 6999, stock: 40, categoryId: sports.id,
      avgRating: 4.5, reviewCount: 8900,
      images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500'],
    },
    {
      title: 'PowerMax Fitness TDM-100S Motorized Treadmill',
      description: 'PowerMax treadmill with 2HP motor, 12 preset programs, auto incline, and 100kg capacity.',
      price: 29999, stock: 10, categoryId: sports.id,
      avgRating: 4.3, reviewCount: 4500,
      images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500'],
    },
    {
      title: 'Optimum Nutrition Gold Standard Whey 5lbs',
      description: 'ON Gold Standard 100% Whey with 24g protein per serving, Double Rich Chocolate flavor.',
      price: 7999, stock: 60, categoryId: sports.id,
      avgRating: 4.6, reviewCount: 89000,
      images: ['https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500'],
    },
    {
      title: 'Decathlon Kipsta Football Size 5',
      description: 'Decathlon Kipsta football with 32-panel design, FIFA quality approved.',
      price: 799, stock: 150, categoryId: sports.id,
      avgRating: 4.2, reviewCount: 34500,
      images: ['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=500'],
    },
    {
      title: 'Hercules Roadeo Turner 26T MTB Cycle',
      description: 'Hercules MTB with 21-speed Shimano gears, front suspension, and V-brakes.',
      price: 12999, stock: 15, categoryId: sports.id,
      avgRating: 4.1, reviewCount: 7800,
      images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500'],
    },
    {
      title: 'MuscleBlaze Creatine Monohydrate 250g',
      description: 'MuscleBlaze 100% pure creatine monohydrate for strength and power gains.',
      price: 699, stock: 150, categoryId: sports.id,
      avgRating: 4.3, reviewCount: 34500,
      images: ['https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=500'],
    },
    {
      title: 'Adidas Tiro Training Track Pants',
      description: 'Adidas Tiro track pants with tapered fit, zip cuffs, and 3-stripe design.',
      price: 1699, stock: 100, categoryId: sports.id,
      avgRating: 4.3, reviewCount: 31200,
      images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500'],
    },
    {
      title: 'Lifelong Resistance Bands Set of 5',
      description: 'Latex resistance bands in 5 levels from 10 to 50 lbs for home workouts.',
      price: 499, stock: 200, categoryId: sports.id,
      avgRating: 4.1, reviewCount: 19800,
      images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500'],
    },
    {
      title: 'Boldfit Gym Gloves with Wrist Support',
      description: 'Anti-slip gym gloves with padded palm and adjustable wrist support strap.',
      price: 299, stock: 250, categoryId: sports.id,
      avgRating: 4.0, reviewCount: 45600,
      images: ['https://images.unsplash.com/photo-1434682966572-0bd4bea0ef6e?w=500'],
    },

    // ════════════════════════════════════
    // BEAUTY & CARE — 15 products
    // ════════════════════════════════════
    {
      title: 'Minimalist 10% Niacinamide Serum 30ml',
      description: 'Oil control serum with 10% Niacinamide and 1% Zinc for clear, balanced skin.',
      price: 349, stock: 250, categoryId: beauty.id,
      avgRating: 4.5, reviewCount: 28700,
      images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500'],
    },
    {
      title: 'Mamaearth Onion Hair Oil 250ml',
      description: 'Onion hair oil with castor and bhringraj for hair fall control and hair growth.',
      price: 349, stock: 300, categoryId: beauty.id,
      avgRating: 4.3, reviewCount: 52000,
      images: ['https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=500'],
    },
    {
      title: 'Lakme Absolute Matte Lipstick',
      description: 'High-pigment matte lip color with argan oil infusion and 8-hour wear.',
      price: 349, stock: 400, categoryId: beauty.id,
      avgRating: 4.2, reviewCount: 16800,
      images: ['https://images.unsplash.com/photo-1586495777744-4e6232bf2278?w=500'],
    },
    {
      title: 'Dove Intense Repair Shampoo 650ml',
      description: 'Dove shampoo with Keratin Actives for damaged hair repair and smoothness.',
      price: 349, stock: 350, categoryId: beauty.id,
      avgRating: 4.3, reviewCount: 67800,
      images: ['https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=500'],
    },
    {
      title: "L'Oreal Paris Revitalift Serum 30ml",
      description: "L'Oreal Paris 1.5% Pure Hyaluronic Acid serum for intense hydration and plumping.",
      price: 499, stock: 200, categoryId: beauty.id,
      avgRating: 4.4, reviewCount: 34500,
      images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500'],
    },
    {
      title: 'Nivea Soft Light Moisturizer 300ml',
      description: 'Nivea Soft with Jojoba Oil and Vitamin E for face, hands, and body.',
      price: 249, stock: 400, categoryId: beauty.id,
      avgRating: 4.3, reviewCount: 89000,
      images: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500'],
    },
    {
      title: 'Biotique Bio Papaya Face Wash 150ml',
      description: 'Biotique ayurvedic face wash with wild papaya and dandelion for deep cleansing.',
      price: 149, stock: 300, categoryId: beauty.id,
      avgRating: 4.1, reviewCount: 45600,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'],
    },
    {
      title: 'WOW Skin Science Apple Cider Vinegar Shampoo',
      description: 'WOW ACV shampoo for scalp detox and frizz control, sulfate and paraben-free.',
      price: 429, stock: 220, categoryId: beauty.id,
      avgRating: 4.2, reviewCount: 38900,
      images: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500'],
    },
    {
      title: 'Maybelline Fit Me Matte Foundation 125',
      description: 'Maybelline Fit Me foundation with pore-minimizing and oil-controlling formula.',
      price: 399, stock: 180, categoryId: beauty.id,
      avgRating: 4.2, reviewCount: 29800,
      images: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500'],
    },
    {
      title: 'Plum Green Tea Pore Cleansing Face Wash',
      description: 'Plum green tea face wash for oily skin — pore cleansing and sebum control.',
      price: 299, stock: 250, categoryId: beauty.id,
      avgRating: 4.4, reviewCount: 21200,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'],
    },
    {
      title: 'The Body Shop Tea Tree Face Wash 250ml',
      description: 'The Body Shop purifying face wash with Community Fair Trade tea tree oil.',
      price: 695, stock: 100, categoryId: beauty.id,
      avgRating: 4.5, reviewCount: 18700,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'],
    },
    {
      title: 'Neutrogena Deep Clean Face Wash 200ml',
      description: 'Neutrogena face wash with beta-hydroxy formula for deep pore cleaning.',
      price: 349, stock: 280, categoryId: beauty.id,
      avgRating: 4.3, reviewCount: 31200,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'],
    },
    {
      title: 'Himalaya Herbals Nourishing Skin Cream 150ml',
      description: 'Himalaya winter cream with almond oil and wheat germ oil for deep nourishment.',
      price: 129, stock: 500, categoryId: beauty.id,
      avgRating: 4.2, reviewCount: 78900,
      images: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500'],
    },
    {
      title: 'Sugar Cosmetics Matte Attack Lip Color',
      description: 'Sugar matte lipstick with intense color payoff and long-lasting 10-hour formula.',
      price: 499, stock: 150, categoryId: beauty.id,
      avgRating: 4.3, reviewCount: 14500,
      images: ['https://images.unsplash.com/photo-1586495777744-4e6232bf2278?w=500'],
    },
    {
      title: 'Forest Essentials Tejus Facial Serum',
      description: 'Forest Essentials pure Ayurvedic serum with saffron and 24K gold for radiant skin.',
      price: 1995, stock: 50, categoryId: beauty.id,
      avgRating: 4.6, reviewCount: 8900,
      images: [
        'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
        'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500',
        'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=500',
        'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500',
      ],
    },
  ];

  // ── Insert all products with generated SKU, slug, and ProductImages ─────
  const slugCount: Record<string, number> = {};

  for (let i = 0; i < products.length; i++) {
    const { images, ...fields } = products[i];

    // Generate unique slug (handle duplicates by appending a counter)
    let baseSlug = slugify(fields.title);
    slugCount[baseSlug] = (slugCount[baseSlug] ?? 0) + 1;
    const slug =
      slugCount[baseSlug] === 1 ? baseSlug : `${baseSlug}-${slugCount[baseSlug]}`;

    const sku = makeSku('SKU', i + 1);

    await prisma.product.create({
      data: {
        ...fields,
        sku,
        slug,
        status: ProductStatus.ACTIVE,
        images: {
          create: images.map((url, position) => ({ url, position })),
        },
      },
    });
  }

  console.log(`✅ ${products.length} products seeded`);
  console.log('🎉 Database seeding complete!');
  console.log('─────────────────────────────────────────');
  console.log('Default user  → email: user@amazon-clone.com  | password: password123');
  console.log('Admin user    → email: admin@amazon-clone.com | password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });