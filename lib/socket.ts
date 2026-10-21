"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getSeatId(): string {
  const key = "who-wrote-it.seat-id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

/**
 * Returns a singleton socket connected to whatever origin this page was
 * loaded from — so it works identically whether opened as
 * http://localhost:3000 on the server laptop or http://<LAN_IP>:3000 on
 * the client laptop.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      autoConnect: true,
      auth: { seatId: getSeatId() },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
    });
  }
  return socket;
}
