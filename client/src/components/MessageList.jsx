import React, { useEffect, useRef } from 'react';

function MessageList({ messages, markAsRead, sendReaction, currentUser, loadMoreMessages, hasMoreMessages }) {
  const messagesEndRef = useRef(null);
  const observer = useRef();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    messages.forEach(msg => {
        if(!msg.readBy || !msg.readBy[currentUser]) {
            markAsRead(msg.id)
        }
    })
  }, [messages, markAsRead, currentUser]);

  const firstMessageRef = (node) => {
      if(observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
          if(entries[0].isIntersecting && hasMoreMessages) {
              loadMoreMessages();
          }
      });
      if(node) observer.current.observe(node);
  }

  return (
    <div className="message-list">
        {hasMoreMessages && <div ref={firstMessageRef}></div>}
      {messages.map((msg, index) => (
        <div key={msg.id} className={`message ${msg.sender === currentUser ? 'sent' : 'received'} ${msg.private ? 'private' : ''} ${msg.system ? 'system' : ''}`}>
          <strong>{msg.sender || 'System'}:</strong> {msg.message}
          {msg.fileUrl && <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">View File</a>}
          <div className="reactions">
            {msg.reactions && Object.entries(msg.reactions).map(([reaction, users]) => (
                <span key={reaction} onClick={() => sendReaction(msg.id, reaction)}>
                    {reaction} {users.length}
                </span>
            ))}
            <button onClick={() => sendReaction(msg.id, '👍')}>👍</button>
          </div>
          <div className="read-receipts">
            {msg.readBy && Object.keys(msg.readBy).join(', ')}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
