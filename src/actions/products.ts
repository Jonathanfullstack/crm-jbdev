"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { productSchema } from "@/lib/validations/product";

export async function createProductAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = productSchema.parse(input);

  await db.product.create({
    data: {
      workspaceId: user.workspaceId,
      name: parsed.name.trim(),
      description: parsed.description || null,
      category: parsed.category || null,
      price: parsed.price ?? null,
      isActive: parsed.isActive,
    },
  });

  revalidatePath("/products");
}

export async function toggleProductAction(productId: string) {
  const user = await requireSessionUser();
  const product = await db.product.findFirst({
    where: { id: productId, workspaceId: user.workspaceId },
  });
  if (!product) throw new Error("Produto não encontrado.");

  await db.product.update({
    where: { id: product.id },
    data: { isActive: !product.isActive },
  });
  revalidatePath("/products");
}
