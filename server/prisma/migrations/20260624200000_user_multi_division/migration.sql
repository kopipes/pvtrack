-- Enable FK enforcement for this migration
PRAGMA foreign_keys=OFF;

-- Create UserDivision join table
CREATE TABLE "UserDivision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    CONSTRAINT "UserDivision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserDivision_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserDivision_userId_divisionId_key" ON "UserDivision"("userId", "divisionId");

-- Migrate existing divisionId data into UserDivision
INSERT INTO "UserDivision" ("id", "userId", "divisionId")
SELECT hex(randomblob(16)), "id", "divisionId"
FROM "User"
WHERE "divisionId" IS NOT NULL;

-- Recreate User table without divisionId
CREATE TABLE "User_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "User_new" SELECT "id", "name", "email", "passwordHash", "role", "isActive", "createdAt", "updatedAt" FROM "User";

DROP TABLE "User";
ALTER TABLE "User_new" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

PRAGMA foreign_keys=ON;
