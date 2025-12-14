import WebSocket from 'ws';
import http from 'http';
import url from 'url';

// Create HTTP server for WebSocket
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active connections with user info
const connections = new Map(); // Map<userId, Set<WebSocket>>
const userSessions = new Map(); // Map<WebSocket, {userId, role, timestamp}>

// Parse query parameters from WebSocket URL
function parseQueryString(queryString) {
  const params = new URLSearchParams(queryString);
  return {
    userId: params.get('userId'),
    token: params.get('token'),
    role: params.get('role'),
  };
}

// Handle new WebSocket connections
wss.on('connection', (ws, req) => {
  try {
    // Parse URL and extract user info
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    const userId = query.userId || null;
    const token = query.token || null;
    const role = query.role || null;

    if (!userId || !token) {
      console.log('❌ WebSocket connection rejected: Missing userId or token');
      ws.close(1008, 'Unauthorized: Missing userId or token');
      return;
    }

    // Store session info
    userSessions.set(ws, {
      userId: parseInt(userId),
      role: role,
      timestamp: new Date(),
      endpoint: pathname,
    });

    // Add to connections map
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    connections.get(userId).add(ws);

    console.log(`🟢 WebSocket connected - User: ${userId} (${role}) - Total users: ${connections.size}`);
    console.log(`   Active connections for user ${userId}: ${connections.get(userId).size}`);

    // Send confirmation message
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: `Connected to real-time updates for user ${userId}`,
      userId: userId,
      timestamp: new Date().toISOString(),
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`📨 Message from user ${userId}:`, message.type);

        // Handle different message types
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      const session = userSessions.get(ws);
      if (session) {
        const userId = session.userId;
        const userConnections = connections.get(userId.toString());
        if (userConnections) {
          userConnections.delete(ws);
          if (userConnections.size === 0) {
            connections.delete(userId.toString());
          }
        }
        userSessions.delete(ws);
        console.log(`🔴 WebSocket disconnected - User: ${userId} - Remaining connections: ${connections.size}`);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  } catch (error) {
    console.error('Error handling WebSocket connection:', error);
    ws.close(1011, 'Internal server error');
  }
});

// Function to broadcast message to specific user
export function broadcastToUser(userId, message) {
  const userConnections = connections.get(userId.toString());
  if (userConnections && userConnections.size > 0) {
    const messageStr = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString(),
    });

    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });

    console.log(`📤 Broadcast to user ${userId}: ${message.type} (${userConnections.size} connections)`);
    return true;
  }
  return false;
}

// Function to broadcast to all connected users (admin notifications)
export function broadcastToAll(message) {
  let count = 0;
  connections.forEach((userConnections) => {
    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString(),
        }));
        count++;
      }
    });
  });

  console.log(`📢 Broadcast to all: ${message.type} (${count} connections)`);
  return count;
}

// Function to broadcast to users by role
export function broadcastToRole(role, message) {
  let count = 0;
  connections.forEach((userConnections) => {
    userConnections.forEach((ws) => {
      const session = userSessions.get(ws);
      if (session && session.role === role && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString(),
        }));
        count++;
      }
    });
  });

  console.log(`📢 Broadcast to ${role}: ${message.type} (${count} connections)`);
  return count;
}

// Get connection stats
export function getStats() {
  let totalConnections = 0;
  connections.forEach((userConnections) => {
    totalConnections += userConnections.size;
  });

  return {
    totalUsers: connections.size,
    totalConnections: totalConnections,
    users: Array.from(connections.entries()).map(([userId, conns]) => ({
      userId,
      connections: conns.size,
    })),
  };
}

// Start server
const PORT = process.env.WS_PORT || 8000;
server.listen(PORT, () => {
  console.log(`\n🚀 WebSocket Server running on ws://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - /notifications (for notification updates)`);
  console.log(`   - /disbursements (for disbursement updates)`);
  console.log(`   - /receipts (for receipt updates)`);
  console.log(`   - /transactions (for transaction updates)`);
  console.log(`   - /override-transactions (for override request updates)`);
  console.log(`   - /fund-accounts (for fund account updates)`);
  console.log(`   - /cheques (for cheque updates)`);
  console.log(`   - /dashboard (for dashboard updates)`);
  console.log(`   - /activity-logs (for activity updates)\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing WebSocket server...');
  wss.clients.forEach((ws) => {
    ws.close(1001, 'Server shutting down');
  });
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

export default { broadcastToUser, broadcastToAll, broadcastToRole, getStats };
