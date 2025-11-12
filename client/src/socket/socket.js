// socket.js - Socket.io client setup

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { notify, showBrowserNotification } from '../utils/notifications';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook for using socket.io
export const useSocket = (username) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [unreadCounts, setUnreadCounts] = useState({});

  // Connect to socket server
  const connect = () => {
    socket.connect();
    if (username) {
      socket.emit('user_join', username);
    }
  };

  // Disconnect from socket server
  const disconnect = () => {
    socket.disconnect();
  };

  // Send a message
  const sendMessage = (message, fileUrl) => {
    socket.emit('send_message', { message, room: currentRoom, fileUrl });
  };
  
  // Switch room
  const joinRoom = (roomName) => {
      socket.emit('join_room', roomName, (roomMessages) => {
          setMessages(roomMessages);
          setCurrentRoom(roomName);
          setUnreadCounts(prev => ({ ...prev, [roomName]: 0 }));
      });
  };

  // Fetch more messages
  const fetchMessages = async (page) => {
    const response = await fetch(`http://localhost:5000/api/messages/${currentRoom}?page=${page}`);
    const data = await response.json();
    setMessages(prev => [...data.messages, ...prev]);
    setHasMoreMessages(data.hasMore);
  };

  // Send a private message
  const sendPrivateMessage = (to, message) => {
    socket.emit('private_message', { to, message });
  };

  // Set typing status
  const setTyping = (isTyping) => {
    socket.emit('typing', { isTyping, room: currentRoom });
  };

  // Mark a message as read
  const markAsRead = (messageId) => {
      socket.emit('message_read', { messageId, room: currentRoom });
  };

  // Send a reaction
  const sendReaction = (messageId, reaction) => {
      socket.emit('message_reaction', { messageId, reaction, room: currentRoom });
  }

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Message events
    const onReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      if(message.sender !== username) {
          notify(`New message from ${message.sender}`);
          showBrowserNotification('New Message', `${message.sender}: ${message.message}`);
          if (message.room !== currentRoom) {
              setUnreadCounts(prev => ({...prev, [message.room]: (prev[message.room] || 0) + 1}));
          }
      }
    };

    const onMessageUpdated = (updatedMessage) => {
        setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
    };

    const onPrivateMessage = (message) => {
        setMessages((prev) => [...prev, message]);
        if (message.sender !== username) {
            notify(`Private message from ${message.sender}`);
            showBrowserNotification('Private Message', `${message.sender}: ${message.message}`);
        }
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };
    
    const onRoomList = (roomList) => {
        setRooms(roomList);
    }

    const onUserJoined = (user) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), system: true, message: `${user.username} joined the chat` },
      ]);
      notify(`${user.username} joined the chat`);
    };

    const onUserLeft = (user) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), system: true, message: `${user.username} left the chat` },
      ]);
      notify(`${user.username} left the chat`);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    // System messages
    const onSystemMessage = (message) => {
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), system: true, message },
        ]);
    }

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('message_updated', onMessageUpdated);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('room_list', onRoomList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);
    socket.on('system_message', onSystemMessage);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('message_updated', onMessageUpdated);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('room_list', onRoomList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
      socket.off('system_message', onSystemMessage);
    };
  }, [username, currentRoom]);

  return {
    socket,
    isConnected,
    messages,
    hasMoreMessages,
    users,
    typingUsers,
    rooms,
    currentRoom,
    unreadCounts,
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    fetchMessages,
    sendPrivateMessage,
    setTyping,
    markAsRead,
    sendReaction,
  };
};

export default socket;
