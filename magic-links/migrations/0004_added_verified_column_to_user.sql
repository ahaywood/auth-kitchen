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
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "magicLink", "magicLinkExpiresAt", "username", "verificationToken", "verificationTokenExpiresAt") SELECT "createdAt", "email", "id", "magicLink", "magicLinkExpiresAt", "username", "verificationToken", "verificationTokenExpiresAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_magicLink_key" ON "User"("magicLink");
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");
CREATE INDEX "User_email_magicLink_idx" ON "User"("email", "magicLink");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
