import { defineApp, ErrorResponse } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
import { Document } from "@/app/Document";
import { Home } from "@/app/pages/Home";
import { setCommonHeaders } from "@/app/headers";
import { sessions, setupSessionStore } from "./session/store";
import { Session } from "./session/durableObject";
import { db, setupDb } from "./db";
import { env } from "cloudflare:workers";
import { LoginPage } from "./app/pages/auth/LoginPage";
import { User } from "@prisma/client";
import { RegisterPage } from "./app/pages/auth/RegisterPage";
export { SessionDurableObject } from "./session/durableObject";

export type AppContext = {
  session: Session | null;
  user: User | null;
};

const app = defineApp([
  setCommonHeaders(),
  async ({ ctx, request, headers }) => {
    await setupDb(env);
    setupSessionStore(env);

    try {
      ctx.session = await sessions.load(request);
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 401) {
        await sessions.remove(request, headers);
        headers.set("Location", "/login");

        return new Response(null, {
          status: 302,
          headers,
        });
      }

      throw error;
    }

    if (ctx.session?.userId) {
      ctx.user = await db.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
      });
    }
  },
  render(Document, [
    route("/", () => new Response("Hello, World!")),
    route("/protected", [
      ({ ctx }) => {
        if (!ctx.user) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/login" },
          });
        }
      },
      Home,
    ]),
    route("/register", RegisterPage),
    route("/login", LoginPage),
    route("/verify", async ({ headers, request }) => {
      // get the token from the URL
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      if (!token) {
        return new Response("No token provided", { status: 400 });
      }

      // verify the token
      const user = await db.user.findUnique({
        where: { magicLink: token },
      });

      if (!user) {
        return new Response("Invalid token", { status: 400 });
      }

      // verify the user
      await db.user.update({
        where: { id: user.id },
        data: { verified: true },
      });

      // set up the session
      await sessions.save(headers, {
        userId: user.id,
      });

      return new Response(null, {
        status: 302,
        headers: { Location: "/protected" },
      });
    }),
    route("/logout", async function ({ request }) {
      const headers = new Headers();
      await sessions.remove(request, headers);
      headers.set("Location", "/");

      return new Response(null, {
        status: 302,
        headers,
      });
    }),
  ]),
]);

export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController) {
    // Write code for updating your API
    switch (controller.cron) {
      case "0 0 * * *":
        // Every day
        const cleanUnverifiedUsers = () => {
          console.log("🧹 Clean up Unverified Users");
          const now = new Date();
          const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
          return db.user.deleteMany({
            where: {
              verified: false,
              createdAt: {
                lte: thirtyDaysAgo,
              },
            },
          });
        };
        await cleanUnverifiedUsers();
        break;
    }
    console.log("⏰ cron processed");
  },
} satisfies ExportedHandler<Env>;
