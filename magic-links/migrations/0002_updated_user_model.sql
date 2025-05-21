-- DropIndex
DROP INDEX "Credential_userId_idx";

-- DropIndex
DROP INDEX "Credential_credentialId_idx";

-- DropIndex
DROP INDEX "Credential_credentialId_key";

-- DropIndex
DROP INDEX "Credential_userId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Credential";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "magicLink" TEXT,
    "magicLinkExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "id", "username") SELECT "createdAt", "id", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_magicLink_key" ON "User"("magicLink");
CREATE INDEX "User_email_magicLink_idx" ON "User"("email", "magicLink");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
