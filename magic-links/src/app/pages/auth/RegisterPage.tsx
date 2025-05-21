"use client";

import { useState } from "react";
import { HandleRegister } from "./actions";

const RegisterPage = () => {
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    const result = await HandleRegister(formData);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Success! Please check your email for a magic link.");
    }
  };
  return (
    <form action={handleSubmit}>
      {message && <p>{message}</p>}
      <h1>Register</h1>
      <div>
        <label htmlFor="username">Username</label>
        <input type="text" name="username" />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" />
      </div>
      <button type="submit">Register</button>
    </form>
  );
};

export { RegisterPage };
