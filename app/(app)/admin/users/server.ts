"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { AllowedEmail } from "@/lib/models/Allowedemail";
import { requireSession } from "@/lib/session";

export interface AllowedEmailDTO {
  id: string;
  email: string;
  createdAt: string;
}

async function requireAdmin() {
  const session = await requireSession();
  if (session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Non autorizzato");
  }
  return session;
}

export async function getAllowedEmails(): Promise<AllowedEmailDTO[]> {
  await requireAdmin();
  await connectDB();
  const emails = await AllowedEmail.find().sort({ createdAt: -1 }).lean();
  return emails.map((e: any) => ({
    id: e._id.toString(),
    email: e.email,
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function addAllowedEmail(email: string): Promise<void> {
  await requireAdmin();
  await connectDB();
  const normalized = email.toLowerCase().trim();
  await AllowedEmail.updateOne(
    { email: normalized },
    { email: normalized },
    { upsert: true }
  );
  revalidatePath("/admin/users");
}

export async function removeAllowedEmail(id: string): Promise<void> {
  await requireAdmin();
  await connectDB();
  await AllowedEmail.findByIdAndDelete(id);
  revalidatePath("/admin/users");
}
