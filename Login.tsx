import React, { useState } from 'react';

interface User {
  name: string;
  token?: string;
}

export default function BadComponent() {
  const [user, setUser] = useState<User>(); 

  const handleLog = () => {
    const text = "Logging user action";
    console.log(text); 
    
    try {
      let data = JSON.parse('{"token": "valid-token"}');
      if (user) {
        setUser({ ...user, token: data.token });
      }
    } catch (err: unknown) { 
      if (err instanceof Error) {
        console.error("Problem with login token:", err.message);
      } else {
        console.error("Problem with login token:", String(err));
      }
    }
  };

  if (user) {
    return (
      <React.Fragment>
        <h1>Привет, {user.name}</h1>
        <button onClick={handleLog}>Клик</button> 
      </React.Fragment>
    );
  }

  return <div>Please log in</div>;
}
