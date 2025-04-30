"use client";

import { useState } from "react";
import { handleLogin } from "./actions"

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    const result = await handleLogin(formData);
    if (result.error) {
      setError(result.error);
    }
    window.location.href = "/";
  }

  return (
    <form action={handleSubmit}>
      <h1>Login</h1>
      <div>
        <label htmlFor="username">Username</label>
        <input type="text" name="username" placeholder="Username" />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input type="password" name="password" placeholder="Password" />
      </div>
      <button type="submit">Login</button>
    </form>
  )
}

export { LoginPage }