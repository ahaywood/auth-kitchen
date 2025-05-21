import { defineApp, ErrorResponse } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
import { Document } from "@/app/Document";
import { Home } from "@/app/pages/Home";
import { setCommonHeaders } from "@/app/headers";
import { userRoutes } from "@/app/pages/user/routes";
import { sessions, setupSessionStore } from "./session/store";
import { Session } from "./session/durableObject";
import { db, setupDb } from "./db";
import type { Role, User } from "@prisma/client";
import { env } from "cloudflare:workers";
import { Constants } from "./app/lib/Constants";
export { SessionDurableObject } from "./session/durableObject";

export type AppContext = {
  session: Session | null;
  user: (User & { role: Role }) | null;
};

const isAuthenticated = ({ ctx }: { ctx: AppContext }) => {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/user/login" },
    });
  }
};

const isAdmin = ({ ctx }: { ctx: AppContext }) => {
  if (ctx.user?.role.id !== Constants.ROLES.ADMIN) {
    return new Response("You are not authorized to access this page");
  }
};

const isUser = ({ ctx }: { ctx: AppContext }) => {
  if (ctx.user?.role.id && ctx.user?.role.id > Constants.ROLES.USER) {
    return new Response("You are not authorized to access this page");
  }
};

export default defineApp([
  setCommonHeaders(),
  async ({ ctx, request, headers }) => {
    setupSessionStore(env);
    await setupDb();

    try {
      ctx.session = await sessions.load(request);
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 401) {
        await sessions.remove(request, headers);
        headers.set("Location", "/user/login");

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
        include: {
          role: true,
        },
      });
    }
  },
  render(Document, [
    route("/", () => new Response("Hello, World!")),
    route("/protected", [isAuthenticated, isUser, Home]),
    route("/admin", [isAuthenticated, isAdmin, Home]),
    route("/guest", [isAuthenticated, Home]),
    prefix("/user", userRoutes),
  ]),
]);
