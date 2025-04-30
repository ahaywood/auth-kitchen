"use client";

import { useState } from "react";
import { handleRegister } from "./actions"

const RegisterPage = () => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    const result = await handleRegister(formData);
    if (result.error) {
      setError(result.error);
    }
    window.location.href = "/login";
  }

  return (
    <form action={handleSubmit}>
      { error && <p style={{ color: "red" }}>{error}</p> }
      <h1>Register</h1>
      <div>
        <label htmlFor="username">Username</label>
        <input type="text" name="username" placeholder="Username" />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" placeholder="Email" />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input type="password" name="password" placeholder="Password" />
      </div>
      <button type="submit">Login</button>
    </form>
  )
}

export { RegisterPage }