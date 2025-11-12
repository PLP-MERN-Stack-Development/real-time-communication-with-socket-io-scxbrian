import { useState } from 'react'

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username) {
      onLogin(username)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button type="submit">Join Chat</button>
    </form>
  )
}

export default LoginForm
