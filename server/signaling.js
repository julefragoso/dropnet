const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:8081", "http://127.0.0.1:8080", "http://127.0.0.1:8081"], // DropNet frontend (all variations)
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected peers
const connectedPeers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔗 Peer connected: ${socket.id}`);

  // Register peer with their identity
  socket.on('register', (data) => {
    const { nodeId, accessCode } = data;
    connectedPeers.set(socket.id, { nodeId, accessCode, socket });
    console.log(`📝 Peer registered: ${nodeId} (${socket.id})`);
    
    // Broadcast updated peer list
    broadcastPeerList();
  });

  // Get list of available peers
  socket.on('getPeers', () => {
    const peers = Array.from(connectedPeers.values()).map(peer => ({
      nodeId: peer.nodeId,
      accessCode: peer.accessCode
    }));
    socket.emit('peerList', peers);
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    const { targetNodeId, offer } = data;
    const targetPeer = findPeerByNodeId(targetNodeId);
    
    if (targetPeer) {
      console.log(`📤 Forwarding offer from ${socket.id} to ${targetPeer.socket.id}`);
      targetPeer.socket.emit('offer', {
        fromNodeId: connectedPeers.get(socket.id)?.nodeId,
        offer: offer
      });
    }
  });

  socket.on('answer', (data) => {
    const { targetNodeId, answer } = data;
    const targetPeer = findPeerByNodeId(targetNodeId);
    
    if (targetPeer) {
      console.log(`📤 Forwarding answer from ${socket.id} to ${targetPeer.socket.id}`);
      targetPeer.socket.emit('answer', {
        fromNodeId: connectedPeers.get(socket.id)?.nodeId,
        answer: answer
      });
    }
  });

  socket.on('iceCandidate', (data) => {
    const { targetNodeId, candidate } = data;
    const targetPeer = findPeerByNodeId(targetNodeId);
    
    if (targetPeer) {
      console.log(`📤 Forwarding ICE candidate from ${socket.id} to ${targetPeer.socket.id}`);
      targetPeer.socket.emit('iceCandidate', {
        fromNodeId: connectedPeers.get(socket.id)?.nodeId,
        candidate: candidate
      });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`🔌 Peer disconnected: ${socket.id}`);
    connectedPeers.delete(socket.id);
    broadcastPeerList();
  });

  // Helper function to find peer by nodeId
  function findPeerByNodeId(nodeId) {
    for (const [socketId, peer] of connectedPeers) {
      if (peer.nodeId === nodeId) {
        return peer;
      }
    }
    return null;
  }

  // Broadcast updated peer list to all connected peers
  function broadcastPeerList() {
    const peers = Array.from(connectedPeers.values()).map(peer => ({
      nodeId: peer.nodeId,
      accessCode: peer.accessCode
    }));
    io.emit('peerList', peers);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    connectedPeers: connectedPeers.size,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(`📡 Ready for WebRTC connections`);
}); 