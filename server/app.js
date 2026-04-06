const { createServer } = require('node:http');
const { parse } = require('node:url');

const next = require('next');
const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? (dev ? '127.0.0.1' : '0.0.0.0');
const port = Number(process.env.PORT ?? 3000);

const rtcRooms = new Map();
const rtcClients = new Map();

function sendJson(socket, payload) {
  if (socket.readyState !== 1) return;
  socket.send(JSON.stringify(payload));
}

function getRoomClients(roomId) {
  if (!rtcRooms.has(roomId)) {
    rtcRooms.set(roomId, new Set());
  }
  return rtcRooms.get(roomId);
}

function cleanupRtcClient(socket) {
  const metadata = rtcClients.get(socket);
  if (!metadata) return;

  const roomClients = rtcRooms.get(metadata.roomId);
  if (roomClients) {
    roomClients.delete(socket);
    if (roomClients.size === 0) {
      rtcRooms.delete(metadata.roomId);
    }
  }

  rtcClients.delete(socket);

  if (metadata.roomId && metadata.user) {
    const remaining = rtcRooms.get(metadata.roomId);
    if (remaining) {
      for (const peerSocket of remaining) {
        sendJson(peerSocket, { type: 'user-left', userId: metadata.user.id });
      }
    }
  }
}

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  const handleUpgrade = app.getUpgradeHandler();

  await app.prepare();

  const server = createServer((request, response) => {
    const parsedUrl = parse(request.url ?? '/', true);
    handle(request, response, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  const rtcWss = new WebSocketServer({ noServer: true });

  wss.on('connection', (socket, request) => {
    setupWSConnection(socket, request, {
      gc: true
    });
  });

  rtcWss.on('connection', (socket) => {
    socket.on('message', (rawMessage) => {
      let payload;

      try {
        payload = JSON.parse(String(rawMessage));
      } catch {
        return;
      }

      if (!payload || typeof payload.type !== 'string') {
        return;
      }

      if (payload.type === 'join') {
        const roomId = String(payload.roomId ?? '');
        const user = payload.user;
        if (!roomId || !user || typeof user.id !== 'string') {
          return;
        }

        const roomClients = getRoomClients(roomId);
        roomClients.add(socket);
        rtcClients.set(socket, {
          roomId,
          user: {
            id: String(user.id),
            name: String(user.name ?? 'User'),
            color: String(user.color ?? '#181614')
          }
        });

        const peers = [];
        for (const peerSocket of roomClients) {
          if (peerSocket === socket) continue;
          const peerMetadata = rtcClients.get(peerSocket);
          if (!peerMetadata?.user) continue;
          peers.push(peerMetadata.user);
        }

        sendJson(socket, { type: 'peers', peers });
        for (const peerSocket of roomClients) {
          if (peerSocket === socket) continue;
          sendJson(peerSocket, { type: 'user-joined', user: rtcClients.get(socket).user });
        }
        return;
      }

      const sender = rtcClients.get(socket);
      if (!sender) return;

      if (payload.type === 'chat') {
        const roomClients = rtcRooms.get(sender.roomId) ?? new Set();
        const clientMessage = payload.message;
        const text = String(clientMessage?.text ?? payload.text ?? '').trim();
        if (!text) return;
        const message = {
          type: 'chat',
          message: {
            id: String(clientMessage?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            text,
            timestamp: Number(clientMessage?.timestamp ?? Date.now()),
            user: sender.user
          }
        };

        for (const peerSocket of roomClients) {
          sendJson(peerSocket, message);
        }
        return;
      }

      if (payload.type === 'signal') {
        const targetUserId = String(payload.to ?? '');
        if (!targetUserId) return;

        const roomClients = rtcRooms.get(sender.roomId) ?? new Set();
        for (const peerSocket of roomClients) {
          const peerMetadata = rtcClients.get(peerSocket);
          if (!peerMetadata || peerMetadata.user.id !== targetUserId) continue;

          sendJson(peerSocket, {
            type: 'signal',
            from: sender.user.id,
            user: sender.user,
            signal: payload.signal
          });
          break;
        }
      }
    });

    socket.on('close', () => {
      cleanupRtcClient(socket);
    });

    socket.on('error', () => {
      cleanupRtcClient(socket);
    });
  });

  server.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/yjs/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
      return;
    }

    if (request.url?.startsWith('/rtc/')) {
      rtcWss.handleUpgrade(request, socket, head, (ws) => {
        rtcWss.emit('connection', ws, request);
      });
      return;
    }

    if (request.url?.startsWith('/rtc')) {
      rtcWss.handleUpgrade(request, socket, head, (ws) => {
        rtcWss.emit('connection', ws, request);
      });
      return;
    }

    if (!request.url?.startsWith('/yjs/')) {
      handleUpgrade(request, socket, head);
      return;
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${dev ? 'localhost' : hostname}:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
