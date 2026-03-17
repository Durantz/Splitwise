"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/session";
import { ShoppingGroup } from "@/lib/models/ShoppingGroup";
import { ShoppingList } from "@/lib/models/ShoppingList";
import { ShoppingItem } from "@/lib/models/ShoppingItem";
import { User } from "@/lib/models/User";

// ------------------------------------------------------------------
// DTO
// ------------------------------------------------------------------

export interface ShoppingGroupDTO {
  id: string;
  name: string;
  adminId: string;
  members: { id: string; name: string; image?: string }[];
  openLists: number;
}

// ------------------------------------------------------------------
// Query
// ------------------------------------------------------------------

export async function getMyShoppingGroups(): Promise<ShoppingGroupDTO[]> {
  const session = await requireSession();
  await connectDB();

  const groups = await ShoppingGroup.find({
    memberIds: session.user.id,
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (groups.length === 0) return [];

  // Raccoglie tutti gli userId unici tra tutti i gruppi
  const allUserIds = [...new Set(groups.flatMap((g) => g.memberIds))];
  const users = await User.find({ _id: { $in: allUserIds } })
    .select("_id name image")
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  // Conta le liste aperte per gruppo
  const groupIds = groups.map((g) => g._id);
  const openCounts = await ShoppingList.aggregate([
    { $match: { groupId: { $in: groupIds }, status: "open" } },
    { $group: { _id: "$groupId", count: { $sum: 1 } } },
  ]);
  const openCountMap = new Map(openCounts.map((r) => [String(r._id), r.count]));

  return groups.map((g) => ({
    id: String(g._id),
    name: g.name,
    adminId: g.adminId,
    members: g.memberIds.map((uid) => {
      const u = userMap.get(uid);
      return {
        id: uid,
        name: u?.name ?? uid,
        image: u?.image,
      };
    }),
    openLists: openCountMap.get(String(g._id)) ?? 0,
  }));
}

// ------------------------------------------------------------------
// Mutations
// ------------------------------------------------------------------

export async function createShoppingGroup(name: string): Promise<string> {
  const session = await requireSession();
  await connectDB();

  const group = await ShoppingGroup.create({
    name: name.trim(),
    adminId: session.user.id,
    memberIds: [session.user.id],
  });

  revalidatePath("/spesa");
  return String(group._id);
}

export async function addShoppingGroupMember(
  groupId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();
  await connectDB();

  const group = await ShoppingGroup.findById(groupId);
  if (!group) return { success: false, error: "Gruppo non trovato" };
  if (group.adminId !== session.user.id)
    return { success: false, error: "Solo l'admin può invitare membri" };

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return { success: false, error: "Utente non trovato" };

  const uid = String(user._id);
  if (group.memberIds.includes(uid))
    return { success: false, error: "Utente già nel gruppo" };

  group.memberIds.push(uid);
  await group.save();

  revalidatePath("/spesa");
  return { success: true };
}

export async function removeShoppingGroupMember(
  groupId: string,
  userId: string
): Promise<void> {
  const session = await requireSession();
  await connectDB();

  const group = await ShoppingGroup.findById(groupId);
  if (!group) return;
  if (group.adminId !== session.user.id) return;
  if (userId === group.adminId) return; // l'admin non può rimuovere se stesso

  group.memberIds = group.memberIds.filter((id) => id !== userId);
  await group.save();

  revalidatePath("/spesa");
}

export async function deleteShoppingGroup(groupId: string): Promise<void> {
  const session = await requireSession();
  await connectDB();

  const group = await ShoppingGroup.findById(groupId);
  if (!group || group.adminId !== session.user.id) return;

  const lists = await ShoppingList.find({ groupId: group._id }).select("_id");
  const listIds = lists.map((l) => l._id);

  await Promise.all([
    ShoppingGroup.deleteOne({ _id: group._id }),
    ShoppingList.deleteMany({ groupId: group._id }),
    ShoppingItem.deleteMany({ listId: { $in: listIds } }),
  ]);

  revalidatePath("/spesa");
}
