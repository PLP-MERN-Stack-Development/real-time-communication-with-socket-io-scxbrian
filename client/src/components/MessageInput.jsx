import React, { useState } from 'react';
import { useSocket } from '../socket/socket';

function MessageInput({ onSendMessage, selectedUser, setFile }) {
  const [message, setMessage] = useState('');
  const { setTyping } = useSocket();

  const handleChange = (e) => {
    setMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setTyping(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  }

  return (
    <form onSubmit={handleSubmit} className="message-input">
      <input
        type="text"
        value={message}
        onChange={handleChange}
        placeholder={selectedUser ? `Private message to ${selectedUser.username}` : 'Type a message...'}
      />
      <input type="file" onChange={handleFileChange} />
      <button type="submit">Send</button>
    </form>
  );
}

export default MessageInput;
