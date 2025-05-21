import { defineScript } from "rwsdk/worker";
import { db, setupDb } from "@/db";

export default defineScript(async () => {
  await setupDb();

  await db.$executeRawUnsafe(`\
    DELETE FROM User;
    DELETE FROM Role;
    DELETE FROM sqlite_sequence;
  `);

  await db.role.createMany({
    data: [
      { id: 1, name: "admin" },
      { id: 2, name: "user" },
    ],
  });

  console.log("🌱 Finished seeding");
});
