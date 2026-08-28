import { hash } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

const name = process.env.ADMIN_NAME;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password) {
  throw new Error(
    "ADMIN_NAME, ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi",
  );
}

if (password.length < 8) {
  throw new Error(
    "ADMIN_PASSWORD minimal 8 karakter",
  );
}

const passwordHash = await hash(password, 12);

await db
  .insert(users)
  .values({
    name,
    email: email.trim().toLowerCase(),
    passwordHash,
    role: "ADMIN",
  })
  .onConflictDoUpdate({
    target: users.email,
    set: {
      name,
      passwordHash,
      role: "ADMIN",
      isActive: true,
      updatedAt: new Date(),
    },
  });

console.log(`Administrator ${email} berhasil disiapkan.`);