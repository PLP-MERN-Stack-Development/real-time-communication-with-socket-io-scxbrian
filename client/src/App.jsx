import React, { useState } from 'react';
import { useSocket } from './socket/socket';
import LoginForm from './components/LoginForm';
import Chat from './components/Chat';

function App() {
  const { connect, isConnected } = useSocket();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (username) => {
    connect(username);
    setIsLoggedIn(true);
  };

  return (
    <div className="App">
      <h1>Socket.io Chat</h1>
      {!isLoggedIn || !isConnected ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <Chat />
      )}
    </div>
  );
}

export default App;
