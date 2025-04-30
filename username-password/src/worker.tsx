import { defineApp, ErrorResponse } from "@redwoodjs/sdk/worker";
import { route, render, prefix } from "@redwoodjs/sdk/router";
import { Document } from "@/app/Document";
import { Home } from "@/app/pages/Home";
import { setCommonHeaders } from "@/app/headers";
import { Session } from "./session/durableObject";
import { db, setupDb } from "./db";
import type { User } from "@prisma/client";
import { env } from "cloudflare:workers";
import { LoginPage } from "./app/pages/auth/LoginPage";
import { RegisterPage } from "./app/pages/auth/RegisterPage";
import { sessions, setupSessionStore } from "./session/store";

export { SessionDurableObject } from "./session/durableObject";

export type AppContext = {
  session: Session | null;
  user: User | null;
};

export default defineApp([
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
      console.log("🔍 FOUND USER");
      console.log(ctx.user);
    }
  },
  render(Document, [
    route("/", () => new Response(`Hello, World!`)),
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

    // auth
    route("/login", LoginPage),
    route("/register", RegisterPage),
    route("/forgot", () => new Response("Forgot")),
    route("/reset", () => new Response("Reset")),
    // route("/verify", () => new Response("Verify")),

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
