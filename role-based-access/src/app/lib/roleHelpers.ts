import { AppContext } from "@/worker";
import { Constants } from "./Constants";

const isUser = ({ ctx }: { ctx: AppContext }) => {
  return ctx.user?.role.id === Constants.ROLES.USER;
};

const isAdmin = ({ ctx }: { ctx: AppContext }) => {
  return ctx.user?.role.id === Constants.ROLES.ADMIN;
};

const betterThanUser = ({ ctx }: { ctx: AppContext }) => {
  return ctx.user?.role?.id && ctx.user?.role?.id <= Constants.ROLES.USER;
};

export { isUser, isAdmin, betterThanUser };
