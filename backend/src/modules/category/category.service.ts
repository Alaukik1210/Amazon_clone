import prisma from "../../config/db";
import { AppError } from "../../utils/AppError";
import { toSlug } from "../../utils/slug";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Ensures slug is unique among categories; appends counter if taken
async function buildUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = toSlug(name);
  let slug = base;
  let i = 1;

  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategory(data: { name: string; description?: string }) {
  const existing = await prisma.category.findUnique({ where: { name: data.name } });
  if (existing) throw new AppError("Category with this name already exists", 409);

  const slug = await buildUniqueSlug(data.name);

  return prisma.category.create({ data: { name: data.name, slug, description: data.description } });
}

export async function updateCategory(
  id: string,
  data: { name?: string; description?: string }
) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError("Category not found", 404);

  // If name is changing, check uniqueness and regenerate slug
  if (data.name && data.name !== category.name) {
    const nameConflict = await prisma.category.findUnique({ where: { name: data.name } });
    if (nameConflict) throw new AppError("Category with this name already exists", 409);
  }

  const slug = data.name ? await buildUniqueSlug(data.name, id) : undefined;

  return prisma.category.update({
    where: { id },
    data: { ...data, ...(slug && { slug }) },
  });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) throw new AppError("Category not found", 404);

  // Prevent delete if products are assigned — would break FK constraint
  if (category._count.products > 0) {
    throw new AppError(
      `Cannot delete — ${category._count.products} product(s) are assigned to this category. Reassign or delete them first.`,
      409
    );
  }

  await prisma.category.delete({ where: { id } });
}
