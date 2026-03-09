"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { Group } from "@/lib/models/Group";
import { User } from "@/lib/models/User";
import { requireSession } from "@/lib/session";
import type { GroupDTO } from "@/types";
import mongoose from "mongoose";

export async function getUserGroups(userId: string): Promise<GroupDTO[]> {
  await connectDB();
  const groups = await Group.find({ "members.userId": new mongoose.Types.ObjectId(userId) })
    .populate("members.userId", "name email image")
    .sort({ updatedAt: -1 })
    .lean();
  return groups.map((g) => toGroupDTO(g, userId));
}

export async function getGroupById(groupId: string, userId: string): Promise<GroupDTO | null> {
  await connectDB();
  const g = await Group.findById(groupId)
    .populate("members.userId", "name email image")
    .lean();
  if (!g) return null;
  const isMember = g.members.some((m: any) => m.userId._id.toString() === userId);
  if (!isMember) return null;
  return toGroupDTO(g, userId);
}

export async function createGroup(data: { name: string; emoji: string; currency: string }) {
  const session = await requireSession();
  await connectDB();

  const group = await Group.create({
    name: data.name,
    emoji: data.emoji,
    currency: data.currency,
    createdBy: session.user.id,
    members: [{ userId: session.user.id, role: "admin", joinedAt: new Date() }],
  });

  revalidatePath("/groups");
  return group._id.toString();
}

export async function addMemberByEmail(groupId: string, email: string) {
  const session = await requireSession();
  await connectDB();

  const group = await Group.findById(groupId);
  if (!group) throw new Error("Gruppo non trovato");

  const isAdmin = group.members.some(
    (m: any) => m.userId.toString() === session.user.id && m.role === "admin"
  );
  if (!isAdmin) throw new Error("Solo gli admin possono aggiungere membri");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("Nessun utente trovato con questa email");

  const alreadyIn = group.members.some((m: any) => m.userId.toString() === user._id.toString());
  if (alreadyIn) throw new Error("L'utente è già nel gruppo");

  group.members.push({ userId: user._id, role: "member", joinedAt: new Date() });
  await group.save();

  revalidatePath(`/groups/${groupId}`);
}

function toGroupDTO(g: any, currentUserId: string): GroupDTO {
  const members = g.members.map((m: any) => ({
    id: m.userId._id?.toString() ?? m.userId.toString(),
    name: m.userId.name ?? "—",
    email: m.userId.email ?? "",
    image: m.userId.image,
  }));

  const isAdmin = g.members.some(
    (m: any) =>
      (m.userId._id?.toString() ?? m.userId.toString()) === currentUserId &&
      m.role === "admin"
  );

  return {
    id: g._id.toString(),
    name: g.name,
    emoji: g.emoji ?? "💸",
    currency: g.currency ?? "EUR",
    members,
    isAdmin,
  };
}
