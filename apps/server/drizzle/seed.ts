import { password } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { users } from "./migrations/schema";

const db = drizzle(Bun.env.DATABASE_URL!);

const envOrDefault = (key: string, fallback: string) =>
  Bun.env[key]?.trim() || fallback;

const name = envOrDefault("SEED_USER_NAME", "Administrador");
const email = envOrDefault("SEED_USER_EMAIL", "admin@pncp.local").toLowerCase();
const plainTextPassword = envOrDefault("SEED_USER_PASSWORD", "admin123");

const passwordHash = await password.hash(plainTextPassword, {
  algorithm: "bcrypt",
  cost: 10,
});

const [upsertedUser] = await db
  .insert(users)
  .values({
    name,
    email,
    password: passwordHash,
    role: "DEFAULT",
    emailVerified: true,
    twoFactorAuthenticationEnabled: false,
  })
  .onConflictDoUpdate({
    target: users.email,
    set: {
      name,
      password: passwordHash,
      role: "DEFAULT",
      emailVerified: true,
    },
  })
  .returning({ email: users.email });

console.log(`Usuário base sincronizado: ${upsertedUser.email}`);
