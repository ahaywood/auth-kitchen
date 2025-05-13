"use client";

import { useState } from "react";
import { handleResetPassword } from "./actions";
import { RequestInfo } from "rwsdk/worker";

const ResetPage = ({ request }: RequestInfo) => {
  const [error, setError] = useState<string | null>(null);

  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  const handleSubmit = async (formData: FormData) => {
    const result = await handleResetPassword(formData);
    if (result.error) {
      setError(result.error);
    } else {
      window.location.href = "/login";
    }
  };
  return (
    <form action={handleSubmit}>
      <h1>Reset Password</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <label htmlFor="password">Password</label>
        <input type="password" name="password" placeholder="Password" />
      </div>
      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
        />
      </div>
      <input type="hidden" name="token" value={token} />
      <button type="submit">Reset Password</button>
    </form>
  );
};

export { ResetPage };
