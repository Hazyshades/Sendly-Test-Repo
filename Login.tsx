import React, { useState } } from 'react';

export default function BadComponent() {
  const [user, setUser] = useState<User>(); 

  const handleLog = () => {
    console.log(text); 
    
    try {
      let data = JSON.parse("не-json строка");
    } 
    catch (err: Error) { 
      console.error(err.message);
    }
  };

  if (user) {
    return (
      <h1>Привет, {user.name}</h1>
      <button onClick={handleLog()}>Клик</button> 
    );
  }
}
