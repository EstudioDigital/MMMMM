import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getToken() {
  try {
    const stored = localStorage.getItem('matebot-auth')
    if (stored) return JSON.parse(stored)?.state?.token ?? null
  } catch {}
  return null
}

let socket = null

function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      auth: { token: getToken() },
    })
  }
  return socket
}

export function useSocket(event, callback) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const s = getSocket()

    // Update token on each mount in case it changed
    s.auth = { token: getToken() }
    if (!s.connected) s.connect()

    const handler = (...args) => callbackRef.current(...args)
    s.on(event, handler)
    return () => s.off(event, handler)
  }, [event])
}