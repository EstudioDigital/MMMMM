import { useEffect } from 'react'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', { autoConnect: true })

export function useSocket(event, callback) {
  useEffect(() => {
    socket.on(event, callback)
    return () => socket.off(event, callback)
  }, [event, callback])
}
