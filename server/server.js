const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});


let users = {};
let messages = {
  general: [],
  random: [],
  tech: []
};
let typingUsers = {};
const rooms = ['general', 'random', 'tech'];

io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle user join
  socket.on('user_join', (username) => {
    users[socket.id] = { id: socket.id, username };
    socket.join('general');
    console.log(`${username} joined the chat`);
    socket.emit('system_message', `Welcome, ${username}! You are in the #general room.`);
    socket.broadcast.to('general').emit('user_joined', { username, id: socket.id });
    io.emit('user_list', Object.values(users));
    io.emit('room_list', rooms); // Send rooms to the client
  });

  // Handle joining a room
  socket.on('join_room', (roomName, callback) => {
    socket.join(roomName);
    // leave other rooms
    for (const room of socket.rooms) {
      if (room !== socket.id && room !== roomName) {
        socket.leave(room);
      }
    }
    callback(messages[roomName].slice(-20)); // Send last 20 messages
    socket.emit('system_message', `You joined the #${roomName} room.`);
  });

  // Handle sending messages to a room
  socket.on('send_message', (data) => {
    if (!users[socket.id]) return;

    const { message, room, fileUrl } = data;
    const { username } = users[socket.id];
    const msg = {
      id: Date.now(),
      sender: username,
      message,
      fileUrl,
      timestamp: new Date().toISOString(),
      readBy: { [username]: true }
    };
    if (messages[room]) {
        messages[room].push(msg);
    } else {
        messages[room] = [msg]
    }

    io.to(room).emit('receive_message', msg);
  });

  // Handle message read
  socket.on('message_read', ({ messageId, room }) => {
    if (!users[socket.id]) return;

    const { username } = users[socket.id];
    const roomMessages = messages[room] || [];
    const message = roomMessages.find(m => m.id === messageId);

    if (message) {
      if (!message.readBy) {
        message.readBy = {};
      }
      message.readBy[username] = true;
      io.to(room).emit('message_updated', message);
    }
  });

    // Handle message reaction
    socket.on('message_reaction', ({ messageId, reaction, room }) => {
        if (!users[socket.id]) return;

        const roomMessages = messages[room] || [];
        const message = roomMessages.find(m => m.id === messageId);

        if (message) {
            if (!message.reactions) {
                message.reactions = {};
            }
            if (!message.reactions[reaction]) {
                message.reactions[reaction] = [];
            }
            message.reactions[reaction].push(users[socket.id].username);
            io.to(room).emit('message_updated', message);
        }
    });

  // Handle private messages
  socket.on('private_message', (data) => {
    if (!users[socket.id]) return;

    const { to, message } = data;
    const { username: sender } = users[socket.id];

    const recipientSocket = Object.values(users).find(user => user.id === to);
    if (recipientSocket) {
      const msg = {
        id: Date.now(),
        sender,
        recipient: recipientSocket.username,
        message,
        private: true,
        timestamp: new Date().toISOString(),
      };

      // Send to recipient
      io.to(to).emit('private_message', msg);
      // Send to self
      socket.emit('private_message', msg);

    } else {
      socket.emit('system_error', `User with ID ${to} not found.`);
    }
  });

  // Handle typing in a room
  socket.on('typing', (data) => {
    if (!users[socket.id]) return;

    const { isTyping, room } = data;
    const { username } = users[socket.id];
    if (isTyping) {
      if (!typingUsers[room]) {
        typingUsers[room] = {};
      }
      typingUsers[room][socket.id] = username;
    } else {
      if (typingUsers[room]) {
        delete typingUsers[room][socket.id];
      }
    }
    if (typingUsers[room]) {
        io.to(room).emit('typing_users', Object.values(typingUsers[room]));
    } else {
        io.to(room).emit('typing_users', []);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username } = users[socket.id];
      // Notify rooms the user was in
      socket.rooms.forEach(room => {
        if(room !== socket.id) {
            io.to(room).emit('user_left', { username, id: socket.id });
        }
      })
      console.log(`${username} left the chat`);
    }

    delete users[socket.id];
    // Also remove from typing users
    for (const room in typingUsers) {
        if (typingUsers[room][socket.id]) {
            delete typingUsers[room][socket.id];
            io.to(room).emit('typing_users', Object.values(typingUsers[room]));
        }
    }


    io.emit('user_list', Object.values(users));
  });
});

// API routes
app.get('/api/messages/:room', (req, res) => {
    const { room } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const roomMessages = messages[room] || [];
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedMessages = roomMessages.slice(startIndex, endIndex);
    res.json({ 
        messages: paginatedMessages, 
        hasMore: endIndex < roomMessages.length 
    });
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
