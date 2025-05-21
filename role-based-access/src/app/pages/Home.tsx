import { RequestInfo } from "rwsdk/worker";
import { Constants } from "../lib/Constants";

export function Home({ ctx }: RequestInfo) {
  return (
    <div>
      <p>
        <pre>{JSON.stringify(ctx.user, null, 2)}</pre>
        {ctx.user?.username
          ? `You are logged in as user ${ctx.user.username} and your role is ${ctx.user.role.name}`
          : "You are not logged in"}
      </p>
      {ctx.user?.role.id === Constants.ROLES.USER && (
        <p>You can only see user things.</p>
      )}

      {ctx.user?.role.id === Constants.ROLES.ADMIN && (
        <p>You can only see admin things.</p>
      )}

      {ctx.user?.role?.id && ctx.user?.role?.id <= Constants.ROLES.USER && (
        <p>You can see user things.</p>
      )}
    </div>
  );
}
