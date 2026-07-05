import React, { useState } from "react";

interface User {
  name: string;
}

export default function BadComponent() {
  const [user, setUser] = useState<User | null>(null);

  const handleLog = () => {
    console.log(user?.name ?? "No user");

    try {
      const data = JSON.parse('{"key": "valid-json"}');
      console.log(data);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  };

  if (user) {
    return (
      <>
        <h1>Hello, {user.name}</h1>
        <button onClick={handleLog}>Click</button>
      </>
    );
  }

  return <p>Please log in.</p>;
}
