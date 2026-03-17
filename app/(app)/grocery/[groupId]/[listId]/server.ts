"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/session";
import { ShoppingGroup } from "@/lib/models/ShoppingGroup";
import { ShoppingList } from "@/lib/models/ShoppingList";
import { ShoppingItem } from "@/lib/models/ShoppingItem";
import { ShoppingProduct } from "@/lib/models/ShoppingProduct";
import mongoose from "mongoose";

// ------------------------------------------------------------------
// DTO
// ------------------------------------------------------------------

export interface ShoppingItemDTO {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  note: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
  addedBy: string;
}

export interface ShoppingListDetailDTO {
  id: string;
  name: string;
  status: "open" | "completed";
  groupId: string;
  groupName: string;
  items: ShoppingItemDTO[];
  members: { id: string; name: string; image?: string }[];
}

// ------------------------------------------------------------------
// Query
// ------------------------------------------------------------------

export async function getShoppingListDetail(
  groupId: string,
  listId: string
): Promise<ShoppingListDetailDTO | null> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const lId = new mongoose.Types.ObjectId(listId);

  const group = await ShoppingGroup.findOne({
    _id: gId,
    memberIds: session.user.id,
  }).lean();
  if (!group) return null;

  const list = await ShoppingList.findOne({ _id: lId, groupId: gId }).lean();
  if (!list) return null;

  const { User } = await import("@/lib/models/User");
  const users = await User.find({ _id: { $in: group.memberIds } })
    .select("_id name image")
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const items = await ShoppingItem.find({ listId: lId })
    .sort({ checked: 1, createdAt: 1 })
    .lean();

  return {
    id: String(list._id),
    name: list.name,
    status: list.status,
    groupId: groupId,
    groupName: group.name,
    items: items.map((item) => ({
      id: String(item._id),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      note: item.note,
      checked: item.checked,
      checkedBy: item.checkedBy,
      checkedAt: item.checkedAt?.toISOString(),
      addedBy: item.addedBy,
    })),
    members: group.memberIds.map((uid) => {
      const u = userMap.get(uid);
      return { id: uid, name: u?.name ?? uid, image: u?.image };
    }),
  };
}

export async function getProductSuggestions(
  groupId: string,
  query: string
): Promise<string[]> {
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const normalized = query.toLowerCase().trim();

  if (!normalized) {
    // Ritorna i più usati
    const top = await ShoppingProduct.find({ groupId: gId })
      .sort({ count: -1 })
      .limit(8)
      .lean();
    return top.map((p) => p.displayName);
  }

  const products = await ShoppingProduct.find({
    groupId: gId,
    name: { $regex: `^${normalized}`, $options: "i" },
  })
    .sort({ count: -1 })
    .limit(6)
    .lean();

  return products.map((p) => p.displayName);
}

// ------------------------------------------------------------------
// Mutations
// ------------------------------------------------------------------

export async function addShoppingItem(
  groupId: string,
  listId: string,
  data: { name: string; quantity: number; unit: string; note: string }
): Promise<{ success: boolean; item?: ShoppingItemDTO }> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const lId = new mongoose.Types.ObjectId(listId);

  const group = await ShoppingGroup.findOne({
    _id: gId,
    memberIds: session.user.id,
  });
  if (!group) return { success: false };

  const list = await ShoppingList.findOne({ _id: lId, groupId: gId });
  if (!list || list.status === "completed") return { success: false };

  const item = await ShoppingItem.create({
    listId: lId,
    groupId: gId,
    name: data.name.trim(),
    quantity: data.quantity,
    unit: data.unit.trim(),
    note: data.note.trim(),
    checked: false,
    addedBy: session.user.id,
  });

  // Aggiorna storico prodotti (upsert per conteggio)
  const normalized = data.name.toLowerCase().trim();
  await ShoppingProduct.updateOne(
    { groupId: gId, name: normalized },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        displayName: data.name.trim(),
        groupId: gId,
        name: normalized,
      },
    },
    { upsert: true }
  );

  revalidatePath(`/spesa/${groupId}/${listId}`);

  return {
    success: true,
    item: {
      id: String(item._id),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      note: item.note,
      checked: false,
      addedBy: item.addedBy,
    },
  };
}

export async function toggleShoppingItem(
  groupId: string,
  listId: string,
  itemId: string
): Promise<void> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const lId = new mongoose.Types.ObjectId(listId);
  const iId = new mongoose.Types.ObjectId(itemId);

  const group = await ShoppingGroup.findOne({
    _id: gId,
    memberIds: session.user.id,
  });
  if (!group) return;

  const item = await ShoppingItem.findOne({ _id: iId, listId: lId });
  if (!item) return;

  const nowChecked = !item.checked;
  item.checked = nowChecked;
  item.checkedBy = nowChecked ? session.user.id : undefined;
  item.checkedAt = nowChecked ? new Date() : undefined;
  await item.save();

  // Controlla se tutti gli item sono spuntati → completa la lista
  if (nowChecked) {
    const unchecked = await ShoppingItem.countDocuments({
      listId: lId,
      checked: false,
    });
    if (unchecked === 0) {
      await ShoppingList.updateOne(
        { _id: lId },
        { status: "completed", completedAt: new Date() }
      );
    }
  } else {
    // Se era completed e uno viene de-spuntato, torna open
    await ShoppingList.updateOne(
      { _id: lId, status: "completed" },
      { status: "open", $unset: { completedAt: 1 } }
    );
  }

  revalidatePath(`/spesa/${groupId}/${listId}`);
}

export async function updateShoppingItem(
  groupId: string,
  listId: string,
  itemId: string,
  data: { name: string; quantity: number; unit: string; note: string }
): Promise<void> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const group = await ShoppingGroup.findOne({
    _id: gId,
    memberIds: session.user.id,
  });
  if (!group) return;

  await ShoppingItem.updateOne(
    {
      _id: new mongoose.Types.ObjectId(itemId),
      listId: new mongoose.Types.ObjectId(listId),
    },
    {
      name: data.name.trim(),
      quantity: data.quantity,
      unit: data.unit.trim(),
      note: data.note.trim(),
    }
  );

  revalidatePath(`/spesa/${groupId}/${listId}`);
}

export async function deleteShoppingItem(
  groupId: string,
  listId: string,
  itemId: string
): Promise<void> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const group = await ShoppingGroup.findOne({
    _id: gId,
    memberIds: session.user.id,
  });
  if (!group) return;

  await ShoppingItem.deleteOne({
    _id: new mongoose.Types.ObjectId(itemId),
    listId: new mongoose.Types.ObjectId(listId),
  });

  revalidatePath(`/spesa/${groupId}/${listId}`);
}
