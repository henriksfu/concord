'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UserIdentity } from '@/types/board';

type Theme = 'light' | 'dark';

type RemoteUser = {
  id: string;
  name: string;
  color: string;
};

type ChatMessage = {
  id: string;
  text: string;
  timestamp: number;
  user: RemoteUser;
};

type RemoteStreamEntry = {
  user: RemoteUser;
  stream: MediaStream;
};
type RtcSignal = {
  type: 'offer' | 'answer' | 'candidate' | 'renegotiate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useRealtimeCollab(roomId: string, user: UserIdentity) {
  const wsRef = useRef<WebSocket | null>(null);
  const outboxRef = useRef<ChatMessage[]>([]);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const closedByClientRef = useRef(false);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const usersRef = useRef<Map<string, RemoteUser>>(new Map());
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamEntry[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<RemoteUser[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'chat' | 'call'>('chat');

  const getProtocolUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/rtc/`;
  }, []);

  const flushOutbox = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    while (outboxRef.current.length > 0) {
      const message = outboxRef.current.shift();
      if (!message) break;
      ws.send(JSON.stringify({ type: 'chat', message }));
    }
  }, []);

  const sendSignal = useCallback((to: string, signal: unknown) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'signal', to, signal }));
  }, []);

  const syncOnlineUsers = useCallback(() => {
    setOnlineUsers(Array.from(usersRef.current.values()));
  }, []);

  const attachLocalTracks = useCallback((connection: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) return;

    for (const track of stream.getTracks()) {
      const exists = connection.getSenders().some((sender) => sender.track?.id === track.id);
      if (!exists) {
        connection.addTrack(track, stream);
      }
    }
  }, []);

  const createPeerConnection = useCallback(
    (remoteUser: RemoteUser) => {
      const existing = peerConnectionsRef.current.get(remoteUser.id);
      if (existing) return existing;

      const connection = new RTCPeerConnection(rtcConfig);
      peerConnectionsRef.current.set(remoteUser.id, connection);

      connection.onicecandidate = (event) => {
        if (!event.candidate) return;
        sendSignal(remoteUser.id, { type: 'candidate', candidate: event.candidate });
      };

      connection.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        setRemoteStreams((current) => {
          const next = [...current];
          const index = next.findIndex((entry) => entry.user.id === remoteUser.id);
          const payload = { user: remoteUser, stream };
          if (index >= 0) next[index] = payload;
          else next.push(payload);
          return next;
        });
      };

      connection.onconnectionstatechange = () => {
        if (connection.connectionState === 'failed' || connection.connectionState === 'closed') {
          connection.close();
          peerConnectionsRef.current.delete(remoteUser.id);
          setRemoteStreams((current) => current.filter((entry) => entry.user.id !== remoteUser.id));
        }
      };

      connection.onnegotiationneeded = async () => {
        if (user.id > remoteUser.id) return;
        try {
          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          sendSignal(remoteUser.id, { type: 'offer', sdp: offer });
        } catch {
          // Ignore transient renegotiation failures.
        }
      };

      attachLocalTracks(connection);
      return connection;
    },
    [attachLocalTracks, sendSignal, user.id]
  );

  const createAndSendOffer = useCallback(
    async (remoteUser: RemoteUser) => {
      try {
        const connection = createPeerConnection(remoteUser);
        attachLocalTracks(connection);
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        sendSignal(remoteUser.id, { type: 'offer', sdp: offer });
      } catch {
        // Keep collaboration alive even if one peer negotiation fails.
      }
    },
    [attachLocalTracks, createPeerConnection, sendSignal]
  );

  const handleSignal = useCallback(
    async (fromUser: RemoteUser, signal: RtcSignal) => {
      usersRef.current.set(fromUser.id, fromUser);
      const connection = createPeerConnection(fromUser);

      try {
        if (signal?.type === 'offer' && signal.sdp) {
          await connection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          attachLocalTracks(connection);
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          sendSignal(fromUser.id, { type: 'answer', sdp: answer });
          return;
        }

        if (signal?.type === 'answer' && signal.sdp) {
          await connection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          return;
        }

        if (signal?.type === 'candidate' && signal.candidate) {
          await connection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch {
        // Ignore individual signaling errors to avoid taking down the room.
      }
    },
    [attachLocalTracks, createPeerConnection, sendSignal]
  );

  useEffect(() => {
    closedByClientRef.current = false;

    const connect = () => {
      const ws = new WebSocket(getProtocolUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttemptRef.current = 0;
        ws.send(
          JSON.stringify({
            type: 'join',
            roomId,
            user
          })
        );
        flushOutbox();
      };

      ws.onclose = () => {
        setConnected(false);
        if (closedByClientRef.current) return;
        const attempt = reconnectAttemptRef.current;
        reconnectAttemptRef.current += 1;
        const delay = Math.min(1000 * 2 ** attempt, 7000);
        if (reconnectTimerRef.current) {
          window.clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (payload.type === 'peers') {
        const peers = Array.isArray(payload.peers) ? payload.peers : [];
        usersRef.current.clear();
        for (const peer of peers) {
          if (!peer || peer.id === user.id) continue;
          const remoteUser: RemoteUser = {
            id: String(peer.id),
            name: String(peer.name ?? 'User'),
            color: String(peer.color ?? '#181614')
          };
          usersRef.current.set(remoteUser.id, remoteUser);
          if (user.id < remoteUser.id) {
            createAndSendOffer(remoteUser);
          }
        }
        syncOnlineUsers();
        return;
      }

      if (payload.type === 'user-joined' && payload.user?.id) {
        const remoteUser: RemoteUser = {
          id: String(payload.user.id),
          name: String(payload.user.name ?? 'User'),
          color: String(payload.user.color ?? '#181614')
        };
        usersRef.current.set(remoteUser.id, remoteUser);
        syncOnlineUsers();
        if (user.id < remoteUser.id) {
          createAndSendOffer(remoteUser);
        }
        return;
      }

      if (payload.type === 'user-left' && payload.userId) {
        const remoteUserId = String(payload.userId);
        const connection = peerConnectionsRef.current.get(remoteUserId);
        if (connection) {
          connection.close();
          peerConnectionsRef.current.delete(remoteUserId);
        }
        setRemoteStreams((current) => current.filter((entry) => entry.user.id !== remoteUserId));
        usersRef.current.delete(remoteUserId);
        syncOnlineUsers();
        return;
      }

      if (payload.type === 'chat' && payload.message) {
        const message: ChatMessage = {
          id: String(payload.message.id ?? crypto.randomUUID()),
          text: String(payload.message.text ?? ''),
          timestamp: Number(payload.message.timestamp ?? Date.now()),
          user: {
            id: String(payload.message.user?.id ?? ''),
            name: String(payload.message.user?.name ?? 'User'),
            color: String(payload.message.user?.color ?? '#181614')
          }
        };
        setMessages((current) => {
          if (current.some((item) => item.id === message.id)) {
            return current;
          }
          return [...current.slice(-149), message];
        });
        return;
      }

      if (payload.type === 'signal' && payload.from && payload.signal) {
        const fromUser: RemoteUser = {
          id: String(payload.user?.id ?? payload.from),
          name: String(payload.user?.name ?? 'User'),
          color: String(payload.user?.color ?? '#181614')
        };
        if (payload.signal?.type === 'renegotiate') {
          if (user.id < fromUser.id) {
            void createAndSendOffer(fromUser);
          }
          return;
        }
        handleSignal(fromUser, payload.signal);
      }
      };
    };

    connect();

    return () => {
      closedByClientRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      const ws = wsRef.current;
      ws?.close();
      wsRef.current = null;
      for (const connection of peerConnectionsRef.current.values()) {
        connection.close();
      }
      peerConnectionsRef.current.clear();
      usersRef.current.clear();
      setRemoteStreams([]);
      setOnlineUsers([]);
    };
  }, [createAndSendOffer, flushOutbox, getProtocolUrl, handleSignal, roomId, syncOnlineUsers, user]);

  const requestRenegotiation = useCallback(
    (targetUserId: string) => {
      sendSignal(targetUserId, { type: 'renegotiate' });
      const remoteUser = usersRef.current.get(targetUserId);
      if (remoteUser && user.id < remoteUser.id) {
        void createAndSendOffer(remoteUser);
      }
    },
    [createAndSendOffer, sendSignal, user.id]
  );

  const startCall = useCallback(async () => {
    if (localStreamRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setMicEnabled(true);
    setCameraEnabled(true);

    for (const [remoteUserId, connection] of peerConnectionsRef.current.entries()) {
      attachLocalTracks(connection);
      requestRenegotiation(remoteUserId);
    }
  }, [attachLocalTracks, requestRenegotiation]);

  const stopCall = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    for (const track of stream.getTracks()) {
      track.stop();
    }

    localStreamRef.current = null;
    setLocalStream(null);
    setMicEnabled(false);
    setCameraEnabled(false);

    for (const [remoteUserId, connection] of peerConnectionsRef.current.entries()) {
      for (const sender of connection.getSenders()) {
        if (sender.track) {
          connection.removeTrack(sender);
        }
      }
      requestRenegotiation(remoteUserId);
    }
  }, [requestRenegotiation]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
    for (const remoteUserId of peerConnectionsRef.current.keys()) {
      requestRenegotiation(remoteUserId);
    }
  }, [requestRenegotiation]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
    for (const remoteUserId of peerConnectionsRef.current.keys()) {
      requestRenegotiation(remoteUserId);
    }
  }, [requestRenegotiation]);

  const sendChat = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      timestamp: Date.now(),
      user: {
        id: user.id,
        name: user.name,
        color: user.color
      }
    };
    setMessages((current) => [...current.slice(-149), message]);
    outboxRef.current.push(message);
    flushOutbox();
  }, [flushOutbox, user.color, user.id, user.name]);

  return useMemo(
    () => ({
      connected,
      onlineUsers,
      messages,
      remoteStreams,
      localStream,
      micEnabled,
      cameraEnabled,
      panelOpen,
      panelTab,
      setPanelOpen,
      setPanelTab,
      sendChat,
      startCall,
      stopCall,
      toggleMic,
      toggleCamera
    }),
    [
      cameraEnabled,
      connected,
      onlineUsers,
      localStream,
      messages,
      micEnabled,
      panelOpen,
      panelTab,
      remoteStreams,
      sendChat,
      startCall,
      stopCall,
      toggleCamera,
      toggleMic
    ]
  );
}
