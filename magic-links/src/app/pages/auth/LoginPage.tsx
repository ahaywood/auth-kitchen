"use client";

import { useState } from "react";
import { HandleLogin } from "./actions";

const LoginPage = () => {
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    const result = await HandleLogin(formData);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Please check your email for a magic link");
    }
  };

  return (
    <form action={handleSubmit}>
      <h1>Login</h1>
      {message && <p>{message}</p>}
      <div>
        <label htmlFor="email">Email</label>
        <input type="text" name="email" />
      </div>
      <button type="submit">Login</button>
    </form>
  );
};

export { LoginPage };
