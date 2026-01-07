import { useState, useEffect, useRef, useCallback } from 'react'

// Use same host as page, but port 3099
const getSocketUrl = () => {
  const host = window.location.hostname
  return `ws://${host}:3099`
}

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
  const cleaningUpRef = useRef(false) // Track if we're intentionally closing
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
    let isMounted = true
    cleaningUpRef.current = false

    const handleStoryStart = (payload) => {
      if (!isMounted) return
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
      if (!isMounted) return
      const { storyId, passed, duration } = payload
      setStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? { ...story, status: passed ? 'passed' : 'failed', duration }
            : story
        )
      )
    }

    const handleOutput = (payload) => {
      if (!isMounted) return
      const { text, type = 'default' } = payload
      setOutput((prev) => [
        ...prev,
        { id: outputIdRef.current++, text, type }
      ])
    }

    const handleLoopComplete = (payload) => {
      if (!isMounted) return
      setStatus(payload?.success ? 'complete' : 'stopped')
    }

    const handleError = (payload) => {
      if (!isMounted) return
      const message = payload?.message || 'Unknown error'
      setStatus('error')
      setOutput((prev) => [
        ...prev,
        { id: outputIdRef.current++, text: `Error: ${message}`, type: 'error' }
      ])
    }

    const handleMessage = (data) => {
      if (!isMounted) return
      
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
            if (isMounted) setStories(message.payload || [])
            break
          case 'status':
            if (isMounted) setStatus(message.payload?.status || 'idle')
            break
          default:
            break
        }
      } catch {
        // Invalid JSON - ignore
      }
    }

    const scheduleReconnect = () => {
      // Don't reconnect if we're cleaning up or unmounted
      if (cleaningUpRef.current || !isMounted) return

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      retryTimeoutRef.current = setTimeout(() => {
        if (isMounted && !cleaningUpRef.current) {
          connect()
        }
      }, retryDelayRef.current)

      retryDelayRef.current = Math.min(
        retryDelayRef.current * BACKOFF_MULTIPLIER,
        MAX_RETRY_DELAY
      )
    }

    const connect = () => {
      if (!isMounted || cleaningUpRef.current) return

      // Clean up existing connection without triggering reconnect
      if (wsRef.current) {
        cleaningUpRef.current = true
        wsRef.current.close()
        cleaningUpRef.current = false
      }

      try {
        const url = getSocketUrl()
        console.log('[WS] Connecting to', url)
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isMounted) {
            ws.close()
            return
          }
          console.log('[WS] Connected')
          setConnected(true)
          retryDelayRef.current = INITIAL_RETRY_DELAY
        }

        ws.onclose = (event) => {
          console.log('[WS] Closed', event.code, cleaningUpRef.current ? '(cleanup)' : '')
          if (!isMounted) return
          setConnected(false)
          
          // Only reconnect if this wasn't an intentional close
          if (!cleaningUpRef.current) {
            scheduleReconnect()
          }
        }

        ws.onerror = (error) => {
          console.log('[WS] Error', error)
          // onclose will handle reconnection
        }

        ws.onmessage = (event) => {
          handleMessage(event.data)
        }
      } catch (err) {
        console.log('[WS] Connection error', err)
        scheduleReconnect()
      }
    }

    // Initial connection
    connect()

    // Cleanup on unmount
    return () => {
      console.log('[WS] Cleanup')
      isMounted = false
      cleaningUpRef.current = true
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
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
