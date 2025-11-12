import React from 'react';

function RoomList({ rooms, currentRoom, joinRoom, unreadCounts }) {
  return (
    <div>
      <h3>Rooms</h3>
      <ul>
        {rooms.map((room) => (
          <li 
            key={room} 
            onClick={() => joinRoom(room)} 
            className={currentRoom === room ? 'active' : ''}
          >
            #{room} {unreadCounts[room] > 0 && <span className="unread">{unreadCounts[room]}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RoomList;
