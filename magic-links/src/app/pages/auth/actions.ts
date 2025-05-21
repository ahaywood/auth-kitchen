"use server";

import { db } from "@/db";
import { Resend } from "resend";
import { env } from "cloudflare:workers";
import { Constants } from "@/app/shared/Constants";

export async function HandleRegister(formData: FormData) {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;

  // validate the form
  if (!email || !username) {
    return { error: "All fields are required" };
  }

  // check if the email address exists
  const emailUser = await db.user.findUnique({
    where: { email },
  });

  if (emailUser) {
    return { error: "Email already exists" };
  }

  // check to see if the username is already taken
  const usernameUser = await db.user.findUnique({
    where: { username },
  });

  if (usernameUser) {
    return { error: "Username already exists" };
  }

  // generate a verification token
  const magicLink = crypto.randomUUID().replace(/-/g, "");
  const magicLinkExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day

  // create a new user
  const newUser = await db.user.create({
    data: {
      email,
      username,
      magicLink,
      magicLinkExpiresAt,
    },
  });

  // send a verification email to the user
  const resend = new Resend(env.RESEND_API);
  const { data, error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: email,
    subject: "🪄 Verify your email",
    text: `Verify your email by clicking here: ${Constants.BASE_URL}/verify?token=${magicLink}`,
  });

  return { success: true };
}

export async function HandleLogin(formData: FormData) {
  const email = formData.get("email") as string;

  // validate the form
  if (!email) {
    return { error: "Email is required" };
  }

  // check if the user exists
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "User not found" };
  }

  // if the user is not verified
  if (!user.verified) {
    return { error: "User not verified yet" };
  }

  // generate a magic link
  const magicLink = crypto.randomUUID().replace(/-/g, "");

  // save the magic link to the database
  await db.user.update({
    where: { id: user.id },
    data: {
      magicLink,
      magicLinkExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
    },
  });

  // send the magic link to the user's email address
  const resend = new Resend(env.RESEND_API);
  const { data, error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: email,
    subject: "🪄 Magic Link",
    text: `Magic link: ${Constants.BASE_URL}/verify?token=${magicLink}`,
  });

  if (error) {
    return { error: "Failed to send email" };
  }

  return { success: true };
}
