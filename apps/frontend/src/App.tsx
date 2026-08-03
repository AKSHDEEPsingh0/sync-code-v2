import React, { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_SERVER_URL = 'http://localhost:5001'

function App() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [code, setCode] = useState<string>(
    '# =========================================\n' +
    '# 🚀 SYNC CODE v2.0 LIVE RUNTIME ENVIRONMENT\n' +
    '# =========================================\n' +
    '# Type ANY arbitrary python functions or algorithms below...\n\n' +
    'print("Hello from the SYNC CODE v2.0 Live Workspace!")'
  )
  const [roomId] = useState<string>('devops-production-room')
  const [consoleOutput, setConsoleOutput] = useState<string>('Console Output will display here...')

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL)
    setSocket(newSocket)
    newSocket.emit('join-room', roomId)

    newSocket.on('code-update', (updatedCode: string) => {
      setCode(updatedCode)
    })

    // Listen for the absolute calculated response from the backend container server
    newSocket.on('run-code-response', (response: string) => {
      setConsoleOutput(response)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [roomId])

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textValue = e.target.value
    setCode(textValue)
    if (socket) {
      socket.emit('code-change', { roomId, code: textValue })
    }
  }

  // Dispatch raw code strings downstream across your active socket containers
  const executePythonCode = () => {
    if (socket) {
      setConsoleOutput("Transmitting code payload to backend container cluster sandbox...")
      socket.emit("run-code-request", { code })
    }
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'monospace', color: '#fff', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#4CAF50' }}>⚡ Sync Code v2.0 Platform Live Workspace</h2>
      <p style={{ color: '#aaa' }}>Infrastructure Status: <span style={{ color: '#4CAF50' }}>● Remote Container Execution Sandbox Connected</span></p>
      <p style={{ color: '#aaa' }}>Current Distributed Room Hash: <strong>{roomId}</strong></p>
      
      <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
        <div style={{ flex: 1 }}>
          <textarea
            value={code}
            onChange={handleTextAreaChange}
            rows={22}
            style={{
              width: '100%',
              backgroundColor: '#2d2d2d',
              color: '#a9ffb7',
              padding: '20px',
              fontFamily: 'Consolas, monospace',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #444',
              outline: 'none',
              lineHeight: '1.5'
            }}
          />
          <button
            onClick={executePythonCode}
            style={{
              marginTop: '15px',
              padding: '12px 30px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
            }}
          >
            ▶ Run Python Code (Container Engine)
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              height: '495px',
              backgroundColor: '#151515',
              color: '#39ff14',
              padding: '20px',
              fontFamily: 'Consolas, monospace',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #333',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              lineHeight: '1.6'
            }}
          >
            {consoleOutput}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
