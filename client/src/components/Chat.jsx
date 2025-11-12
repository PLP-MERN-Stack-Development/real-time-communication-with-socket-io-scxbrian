import React, { useState, useEffect } from 'react';
import { useSocket } from '../socket/socket';
import UserList from './UserList';
import RoomList from './RoomList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { requestNotificationPermission } from '../utils/notifications';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Chat({ username }) {
  const { 
    sendMessage, 
    sendPrivateMessage, 
    joinRoom,
    fetchMessages,
    hasMoreMessages,
    markAsRead,
    sendReaction,
    messages, 
    users, 
    typingUsers, 
    rooms,
    currentRoom,
    unreadCounts,
    disconnect 
  } = useSocket(username);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [file, setFile] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleSendMessage = async (message) => {
    let fileUrl = null;
    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        fileUrl = data.fileUrl;
        setFile(null);
    }

    if (selectedUser) {
      sendPrivateMessage(selectedUser.id, message);
      setSelectedUser(null); 
    } else {
      sendMessage(message, fileUrl);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages) {
        const nextPage = page + 1;
        fetchMessages(nextPage);
        setPage(nextPage);
    }
  }

  return (
    <div className="chat-container">
        <ToastContainer />
      <div className="sidebar">
        <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
        />
        <UserList users={users} onUserSelect={handleUserSelect} selectedUser={selectedUser} />
        <RoomList rooms={rooms} currentRoom={currentRoom} joinRoom={joinRoom} unreadCounts={unreadCounts} />
        <button onClick={disconnect}>Disconnect</button>
      </div>
      <div className="message-container">
        <MessageList 
            messages={messages.filter(msg => msg.message.toLowerCase().includes(searchQuery.toLowerCase()))} 
            markAsRead={markAsRead} 
            sendReaction={sendReaction} 
            currentUser={username} 
            loadMoreMessages={loadMoreMessages} 
            hasMoreMessages={hasMoreMessages} 
        />
        <div className="typing-indicator">
          {typingUsers.length > 0 && (
            <em>{typingUsers.join(', ')} is typing...</em>
          )}
        </div>
        <MessageInput onSendMessage={handleSendMessage} selectedUser={selectedUser} setFile={setFile} />
      </div>
    </div>
  );
}

export default Chat;
