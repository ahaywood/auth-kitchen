import { defineApp, ErrorResponse } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
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
import { ForgotPage } from "./app/pages/auth/ForgotPage";
import { ResetPage } from "./app/pages/auth/ResetPage";

export { SessionDurableObject } from "./session/durableObject";

export type AppContext = {
  session: Session | null;
  user: User | null;
};

const gotoLogin = () => {
  return new Response(null, {
    status: 302,
    headers: { Location: "/login" },
  });
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
        if (!ctx.user || !ctx.user.verified) {
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
    route("/forgot", ForgotPage),
    route("/reset", ResetPage),
    route("/verify", async ({ request }) => {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      // if no token, redirect to login
      if (!token) {
        return gotoLogin();
      }

      // verify the token
      const user = await db.user.findUnique({
        select: {
          id: true,
          verificationExpires: true,
        },
        where: {
          verificationToken: token,
        },
      });

      // if the user is not found, redirect to login
      if (!user) {
        return gotoLogin();
      }

      // if the token has expired, redirect to login
      if (!user.verificationExpires || user.verificationExpires < new Date()) {
        return gotoLogin();
      }

      // verify the user
      await db.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          verificationToken: null,
          verificationExpires: null,
        },
      });

      // redirect to login
      return gotoLogin();
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
