import { RequestInfo } from "rwsdk/worker";
import { Constants } from "../lib/Constants";
import { isUser, isAdmin, betterThanUser } from "../lib/roleHelpers";

export function Home({ ctx }: RequestInfo) {
  return (
    <div>
      <p>
        <pre>{JSON.stringify(ctx.user, null, 2)}</pre>
        {ctx.user?.username
          ? `You are logged in as user ${ctx.user.username} and your role is ${ctx.user.role.name}`
          : "You are not logged in"}
      </p>
      {isUser({ ctx }) && <p>You can only see user things.</p>}

      {isAdmin({ ctx }) && <p>You can only see admin things.</p>}

      {betterThanUser({ ctx }) && <p>You can see user things.</p>}
    </div>
  );
}
