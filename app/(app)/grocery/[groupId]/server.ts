"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/session";
import { ShoppingGroup } from "@/lib/models/ShoppingGroup";
import { ShoppingList } from "@/lib/models/ShoppingList";
import { ShoppingItem } from "@/lib/models/ShoppingItem";
import { User } from "@/lib/models/User";
import mongoose from "mongoose";

// ------------------------------------------------------------------
// DTO
// ------------------------------------------------------------------

export interface ShoppingListDTO {
  id: string;
  name: string;
  status: "open" | "completed";
  createdBy: string;
  completedAt?: string;
  createdAt: string;
  totalItems: number;
  checkedItems: number;
}

export interface ShoppingGroupDetailDTO {
  id: string;
  name: string;
  adminId: string;
  members: { id: string; name: string; image?: string }[];
  lists: ShoppingListDTO[];
}

// ------------------------------------------------------------------
// Query
// ------------------------------------------------------------------

export async function getShoppingGroupDetail(
  groupId: string
): Promise<ShoppingGroupDetailDTO | null> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);

  const group = await ShoppingGroup.findOne({
    _id: gId,
    memberIds: session.user.id,
  }).lean();

  if (!group) return null;
  
  const users = await User.find({ _id: { $in: group.memberIds } })
    .select("_id name image")
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const lists = await ShoppingList.find({ groupId: gId })
    .sort({ createdAt: -1 })
    .lean();

  const listIds = lists.map((l) => l._id);

  // Conta items per lista
  const itemCounts = await ShoppingItem.aggregate([
    { $match: { listId: { $in: listIds } } },
    {
      $group: {
        _id: "$listId",
        total: { $sum: 1 },
        checked: { $sum: { $cond: ["$checked", 1, 0] } },
      },
    },
  ]);
  const countMap = new Map(
    itemCounts.map((r) => [
      String(r._id),
      { total: r.total, checked: r.checked },
    ])
  );

  return {
    id: String(group._id),
    name: group.name,
    adminId: group.adminId,
    members: group.memberIds.map((uid) => {
      const u = userMap.get(uid);
      return { id: uid, name: u?.name ?? uid, image: u?.image };
    }),
    lists: lists.map((l) => {
      const counts = countMap.get(String(l._id)) ?? { total: 0, checked: 0 };
      return {
        id: String(l._id),
        name: l.name,
        status: l.status,
        createdBy: l.createdBy,
        completedAt: l.completedAt?.toISOString(),
        createdAt: l.createdAt.toISOString(),
        totalItems: counts.total,
        checkedItems: counts.checked,
      };
    }),
  };
}

// ------------------------------------------------------------------
// Mutations
// ------------------------------------------------------------------

export async function createShoppingList(
  groupId: string,
  name: string
): Promise<string> {
  const session = await requireSession();
  await connectDB();

  const gId = new mongoose.Types.ObjectId(groupId);
  const group = await ShoppingGroup.findOne({
    _id: gId,
    memberIds: session.user.id,
  });
  if (!group) throw new Error("Gruppo non trovato");

  const list = await ShoppingList.create({
    groupId: gId,
    name: name.trim(),
    status: "open",
    createdBy: session.user.id,
  });

  revalidatePath(`/grocery/${groupId}`);
  return String(list._id);
}

export async function deleteShoppingList(
  groupId: string,
  listId: string
): Promise<void> {
  const session = await requireSession();
  await connectDB();

  const lId = new mongoose.Types.ObjectId(listId);
  const list = await ShoppingList.findById(lId);
  if (!list) return;

  // Solo il creatore o l'admin del gruppo può eliminare
  const group = await ShoppingGroup.findById(list.groupId);
  if (!group) return;
  const canDelete =
    list.createdBy === session.user.id || group.adminId === session.user.id;
  if (!canDelete) return;

  await Promise.all([
    ShoppingList.deleteOne({ _id: lId }),
    ShoppingItem.deleteMany({ listId: lId }),
  ]);

  revalidatePath(`/grocery/${groupId}`);
}
