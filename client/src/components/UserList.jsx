import React from 'react'

function UserList({ users }) {
  return (
    <div>
      <h2>Online Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </div>
  )
}

export default UserList
