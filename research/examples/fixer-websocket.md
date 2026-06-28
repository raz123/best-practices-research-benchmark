# WebSocket Memory Leak Fix: Best Practices Research

## Root Causes of WebSocket Memory Leaks
- Event listeners not removed on close/error — prevents GC of handler closures
- Open connections not tracked — orphaned sockets accumulate on reconnect
- Missing `close()` calls on server-side when client disconnects unexpectedly
- Timer/interval references (heartbeats) not cleared on disconnect
- Closure capture of large objects (request, session data) in event handlers

## Connection Lifecycle Management
- Track all active connections in a `Map<WebSocket, ConnectionMeta>` with metadata (userId, connectedAt, lastActivity)
- Implement `destroy()` method that: clears all listeners, nulls references, removes from tracking map
- Use `ws.readyState` checks before every send operation
- Set explicit `close` codes: 1000 (normal), 1001 (going away), 1008 (policy violation)

## Server-Side Best Practices (Node.js / ws library)
- Set `server.clients` Set or custom tracking — iterate periodically to prune dead connections
- Configure `maxPayload` to prevent memory bombs (e.g., 1MB limit)
- Use `backpressure` handling: check `bufferedAmount` before sending, drop or queue with limits
- Set `perMessageDeflate: false` unless compression is needed (each socket allocates compression context)

## Heartbeat / Keepalive Pattern
- Implement ping/pong with configurable interval (30s typical)
- Track `lastPong` timestamp per connection — terminate if stale
- Use `ws.ping()` not application-level messages for keepalive
- Clear heartbeat interval in the close handler

## Anti-Patterns
- Do NOT rely solely on `on('close')` — also handle `on('error')` which may fire without close
- Do NOT use anonymous functions for event listeners — you can't remove them
- Do NOT keep references to disconnected sockets in any data structure
- Do NOT use `setTimeout` recursion for heartbeats — use `setInterval` with proper cleanup
- Do NOT store per-connection state in module-level variables — use the connection object or a WeakMap

## Error Handling Patterns
```js
// Pattern: Safe teardown
function teardownConnection(ws, meta) {
  clearTimeout(meta.heartbeat);
  ws.removeAllListeners();
  connections.delete(ws);
  if (ws.readyState === WebSocket.OPEN) ws.close(1000, 'Server shutting down');
}
```

## Testing Memory Leaks
- Use `--expose-gc` + `process.memoryUsage()` in integration tests
- Connect N clients, disconnect all, force GC, assert heap returns to baseline
- Monitor `ws.clients.size` over time under load

## Source References
- ws library docs: https://github.com/websockets/ws
- Node.js docs: stream backpressure
- OWASP: WebSocket security guidelines
