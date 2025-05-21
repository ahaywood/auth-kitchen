import { link } from "@/app/shared/links";
import { db } from "@/db";
import { RequestInfo } from "rwsdk/worker";

const VerifyPage = async ({ request }: RequestInfo) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  console.log({ token });

  // if the token doesn't exist, return a 404
  if (!token) {
    return new Response("Not found", { status: 404 });
  }

  // look for the user in the database
  const user = await db.user.findUnique({
    where: { magicLink: token },
  });

  // if the user doesn't exist, return a 404
  if (!user) {
    return new Response("Not found", { status: 404 });
  }

  // if the user has already been verified
  if (user.verified) {
    // could redirect the user to a dedicated page
    return new Response("Not found", { status: 404 });
  }

  // if the verification expiration date is in the future
  if (user.magicLinkExpiresAt && user.magicLinkExpiresAt < new Date()) {
    // could redirect the user to a dedicated page
    return new Response("Not found", { status: 404 });
  }

  // if the user exists, update the user's email address
  await db.user.update({
    where: { id: user.id },
    data: {
      verified: true,
      magicLink: null,
      magicLinkExpiresAt: null,
    },
  });

  return (
    <div>
      <h1>Your Email address has been confirmed</h1>
      <p>
        <a href={link("/login")}>Login</a>
      </p>
    </div>
  );
};

export { VerifyPage };
