/*
  Warnings:

  - The required column `accessToken` was added to the `Booking` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME NOT NULL,
    "guests" INTEGER NOT NULL,
    "nights" INTEGER NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "cleaningFeeCents" INTEGER NOT NULL,
    "serviceFeeCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("checkIn", "checkOut", "cleaningFeeCents", "createdAt", "currency", "guestEmail", "guestName", "guests", "id", "nights", "propertyId", "serviceFeeCents", "status", "subtotalCents", "totalCents") SELECT "checkIn", "checkOut", "cleaningFeeCents", "createdAt", "currency", "guestEmail", "guestName", "guests", "id", "nights", "propertyId", "serviceFeeCents", "status", "subtotalCents", "totalCents" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_accessToken_key" ON "Booking"("accessToken");
CREATE INDEX "Booking_propertyId_idx" ON "Booking"("propertyId");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
