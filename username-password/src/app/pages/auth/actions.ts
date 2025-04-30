"use server";

import { db } from "@/db";
import bcrypt from "bcryptjs";
import { sessions } from "@/session/store";
import { requestInfo } from "@redwoodjs/sdk/worker";
import { Resend } from 'resend';
import { env } from "cloudflare:workers";

export const handleLogin = async (formData: FormData) => {
  const { request, headers } = requestInfo;
  const username = formData.get("username");
  const password = formData.get("password");

  // validate the form
  if (!username || !password) {
    console.log("All fields are required");
    return {
      error: "All fields are required"
    };
  }

  // get the user by their username
  const user = await db.user.findFirst({
    where: {
      username: username as string
    },
  });

  if (!user) {
    console.log("User does not exist");
    return {
      error: "Invalid username or password"
    };
  }

  // check to see if the password is correct
  const isPasswordValid = await bcrypt.compare(password as string, user.password);

  if (!isPasswordValid) {
    console.log("Invalid password");
    return {
      error: "Invalid username or password"
    };
  }

  // create a session for the user using the durable object
  await sessions.save(headers, {
    userId: user.id
  });

  return {
    success: "User logged in successfully"
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
      error: "All fields are required"
    };
  }

  // check to see if the username or email is already taken
  const foundUser = await db.user.findFirst({
    where: {
      OR: [
        { username: username as string },
        { email: email as string }
      ]
    }
  });

  if (foundUser) {
    console.log("Username or email already taken");
    return {
      error: foundUser.username === username
        ? "Username already taken"
        : "Email already taken"
    };
  }

  // generate a salt for the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password as string, salt);

  // create a new user
  const user = await db.user.create({
    data: {
      username: username as string,
      email: email as string,
      password: hashedPassword
    }
  });

  console.log("User created successfully");

  // TODO: Send a welcome email to the user
  const resend = new Resend(env.RESEND_API);
  const { data, error } = await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: 'me@amyhaywood.com',
    subject: "Welcome to our app",
    text: "Welcome to our app."
  });

  if (error) {
    console.log("📥 Error sending email", error);
    return {
      error: "Error sending email"
    };
  }

  console.log("📥 Email sent successfully", data);

  return {
    success: "User created successfully"
  };
};
