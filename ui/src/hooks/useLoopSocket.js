import { useState, useEffect, useRef, useCallback } from 'react'

const SOCKET_URL = 'ws://localhost:3099'
const INITIAL_RETRY_DELAY = 1000
const MAX_RETRY_DELAY = 30000
const BACKOFF_MULTIPLIER = 2

export function useLoopSocket() {
  const [connected, setConnected] = useState(false)
  const [stories, setStories] = useState([])
  const [output, setOutput] = useState([])
  const [status, setStatus] = useState('idle') // idle, running, complete, error

  const wsRef = useRef(null)
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY)
  const retryTimeoutRef = useRef(null)
  const mountedRef = useRef(true)
  const outputIdRef = useRef(1)

  // Send message to server
  const send = useCallback((type, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }, [])

  // Control actions
  const startLoop = useCallback(() => {
    send('start')
    setStatus('running')
  }, [send])

  const stopLoop = useCallback(() => {
    send('stop')
    setStatus('idle')
  }, [send])

  const clearOutput = useCallback(() => {
    setOutput([])
    outputIdRef.current = 1
  }, [])

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    mountedRef.current = true

    const handleStoryStart = (payload) => {
      const { storyId } = payload
      setStatus('running')
      setStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? { ...story, status: 'running' }
            : story
        )
      )
    }

    const handleStoryEnd = (payload) => {
      const { storyId, passed } = payload
      setStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? { ...story, status: passed ? 'passed' : 'failed' }
            : story
        )
      )
    }

    const handleOutput = (payload) => {
      const { text, type = 'info' } = payload
      setOutput((prev) => [
        ...prev,
        { id: outputIdRef.current++, text, type }
      ])
    }

    const handleLoopComplete = () => {
      setStatus('complete')
    }

    const handleError = (payload) => {
      const { message } = payload
      setStatus('error')
      setOutput((prev) => [
        ...prev,
        { id: outputIdRef.current++, text: `Error: ${message}`, type: 'error' }
      ])
    }

    const handleMessage = (data) => {
      try {
        const message = JSON.parse(data)

        switch (message.type) {
          case 'story_start':
            handleStoryStart(message.payload)
            break
          case 'story_end':
            handleStoryEnd(message.payload)
            break
          case 'output':
            handleOutput(message.payload)
            break
          case 'loop_complete':
            handleLoopComplete(message.payload)
            break
          case 'error':
            handleError(message.payload)
            break
          case 'stories':
            // Initial stories list from server
            setStories(message.payload || [])
            break
          case 'status':
            // Status update from server
            setStatus(message.payload?.status || 'idle')
            break
          default:
            // Unknown message type - ignore
            break
        }
      } catch {
        // Invalid JSON - ignore
      }
    }

    const scheduleReconnect = () => {
      if (!mountedRef.current) return

      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect()
        }
      }, retryDelayRef.current)

      // Exponential backoff
      retryDelayRef.current = Math.min(
        retryDelayRef.current * BACKOFF_MULTIPLIER,
        MAX_RETRY_DELAY
      )
    }

    const connect = () => {
      if (!mountedRef.current) return

      // Clean up any existing connection
      if (wsRef.current) {
        wsRef.current.close()
      }

      try {
        const ws = new WebSocket(SOCKET_URL)
        wsRef.current = ws

        ws.onopen = () => {
          if (!mountedRef.current) return
          setConnected(true)
          retryDelayRef.current = INITIAL_RETRY_DELAY
        }

        ws.onclose = () => {
          if (!mountedRef.current) return
          setConnected(false)
          scheduleReconnect()
        }

        ws.onerror = () => {
          // onclose will be called after onerror, so we just let it handle reconnection
        }

        ws.onmessage = (event) => {
          if (!mountedRef.current) return
          handleMessage(event.data)
        }
      } catch {
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return {
    connected,
    stories,
    output,
    status,
    startLoop,
    stopLoop,
    clearOutput,
    send
  }
}
