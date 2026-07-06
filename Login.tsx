import React, { FormEvent, useState } from "react";

type User = {
  name: string;
  token: string;
};

export default function Login() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedToken = token.trim();

    if (!trimmedName || !trimmedToken) {
      setError("Name and token are required.");
      return;
    }

    setUser({ name: trimmedName, token: trimmedToken });
    setError(null);
  };

  if (user) {
    return (
      <section>
        <h1>Hello, {user.name}</h1>
        <p>Login token received.</p>
        <button type="button" onClick={() => setUser(null)}>
          Log out
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      <label htmlFor="login-name">Name</label>
      <input
        id="login-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="username"
      />

      <label htmlFor="login-token">Token</label>
      <input
        id="login-token"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        autoComplete="one-time-code"
      />

      {error && <p role="alert">{error}</p>}

      <button type="submit">Log in</button>
    </form>
  );
}
