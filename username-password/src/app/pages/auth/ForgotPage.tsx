"use client";

import { useState } from "react";
import { handleForgotPassword } from "./actions";

const ForgotPage = () => {
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    const result = await handleForgotPassword(formData);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Please check your email for a link to reset your password.");
    }
  };

  return (
    <form action={handleSubmit}>
      <h1>Forgot Your Password?</h1>
      {message && <p className="text-green-500">{message}</p>}
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" placeholder="Email" />
      </div>
      <button type="submit">Reset Password</button>
    </form>
  );
};

export { ForgotPage };
