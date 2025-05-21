"use server";

import { db } from "@/db";
import bcrypt from "bcryptjs";
import { sessions } from "@/session/store";
import { requestInfo } from "rwsdk/worker";
import { Resend } from "resend";
import { env } from "cloudflare:workers";
import { Constants } from "@/app/shared/constants";

export const handleLogin = async (formData: FormData) => {
  const { request, headers } = requestInfo;
  const username = formData.get("username");
  const password = formData.get("password");

  // validate the form
  if (!username || !password) {
    console.log("All fields are required");
    return {
      error: "All fields are required",
    };
  }

  // get the user by their username
  const user = await db.user.findFirst({
    where: {
      username: username as string,
    },
  });

  if (!user) {
    console.log("User does not exist");
    return {
      error: "Invalid username or password",
    };
  }

  // check to see if the password is correct
  const isPasswordValid = await bcrypt.compare(
    password as string,
    user.password
  );

  if (!isPasswordValid) {
    console.log("Invalid password");
    return {
      error: "Invalid username or password",
    };
  }

  // create a session for the user using the durable object
  await sessions.save(headers, {
    userId: user.id,
  });

  return {
    success: "User logged in successfully",
  };

  console.log(username, password);
};

export const handleRegister = async (formData: FormData) => {
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");

  if (!username || !email || !password) {
    console.log("All fields are required");
    return {
      error: "All fields are required",
    };
  }

  // check to see if the username or email is already taken
  const foundUser = await db.user.findFirst({
    where: {
      OR: [{ username: username as string }, { email: email as string }],
    },
  });

  if (foundUser) {
    console.log("Username or email already taken");
    return {
      error:
        foundUser.username === username
          ? "Username already taken"
          : "Email already taken",
    };
  }

  // generate a salt for the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password as string, salt);

  // create a verification token
  const verificationToken = crypto.randomUUID().replace(/-/g, "");

  // create a new user
  const user = await db.user.create({
    data: {
      username: username as string,
      email: email as string,
      password: hashedPassword,
      verificationToken,
      verificationExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  console.log("User created successfully");

  const resend = new Resend(env.RESEND_API);
  const { data, error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: "me@amyhaywood.com",
    subject: "Welcome to our app",
    text: `Welcome to our app. Please verify your account by clicking the
      link below: ${Constants.BASE_URL}/verify?token=${verificationToken}`,
  });

  if (error) {
    console.log("📥 Error sending email", error);
    return {
      error: "Error sending email",
    };
  }

  console.log("📥 Email sent successfully", data);

  return {
    success: "User created successfully",
  };
};

export const handleForgotPassword = async (formData: FormData) => {
  const email = formData.get("email");

  // validate the form
  if (!email) {
    console.log("All fields are required");
    return {
      success: null,
      error: "All fields are required",
    };
  }

  // look for the email address in the database
  const user = await db.user.findUnique({
    where: {
      email: email as string,
    },
  });

  if (!user) {
    console.log("User not found");
    return {
      success: null,
      error: "User not found",
    };
  }

  // if the user is not verified, return an error
  if (!user.verified) {
    return {
      success: null,
      error: "User not verified",
    };
  }

  // create a reset token
  const resetToken = crypto.randomUUID().replace(/-/g, "");

  // update the user with the reset token
  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  // send the reset token to the user's email
  const resend = new Resend(env.RESEND_API);
  const { data, error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: email as string,
    subject: "Reset Your Password",
    text: `Reset your password by clicking the link below: ${Constants.BASE_URL}/reset?token=${resetToken}`,
  });

  if (error) {
    console.log("📥 Error sending email", error);
    return { success: null, error: "Error sending email" };
  }

  return { success: true, error: null };
};

export const handleResetPassword = async (formData: FormData) => {
  const token = formData.get("token");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (!token || !password || !confirmPassword) {
    return { success: null, error: "All fields are required" };
  }

  // check to see if the password and confirm password match
  if (password !== confirmPassword) {
    return { success: null, error: "Passwords do not match" };
  }

  // check to see if the token is valid
  const user = await db.user.findUnique({
    select: {
      id: true,
      resetTokenExpires: true,
    },
    where: {
      resetToken: token as string,
    },
  });

  if (!user) {
    return { success: null, error: "Invalid token" };
  }

  // check to see if the token has expired
  if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
    return { success: null, error: "Token has expired" };
  }

  // generate a salt for the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password as string, salt);

  // update the user's password
  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return { success: true, error: null };
};
