-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auth0_id" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "encrypted_cpf" TEXT,
    "phone" TEXT,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME
);
INSERT INTO "new_users" ("auth0_id", "avatar_url", "created_at", "email", "encrypted_cpf", "id", "is_active", "last_login_at", "mfa_enabled", "name", "phone", "role", "updated_at") SELECT "auth0_id", "avatar_url", "created_at", "email", "encrypted_cpf", "id", "is_active", "last_login_at", "mfa_enabled", "name", "phone", "role", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_auth0_id_key" ON "users"("auth0_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
