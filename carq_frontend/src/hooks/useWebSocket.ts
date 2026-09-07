"use client";

import { useEffect, useRef, useState } from "react";

import { getWsUrl } from "@/lib/api";

type WsMessage = {
  type: string;
  [key: string]: unknown;
};

export function useWebSocket(path: string | null, onMessage?: (msg: WsMessage) => void) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!path) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(getWsUrl(path!));
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsMessage;
          onMessageRef.current?.(data);
        } catch {
          /* ignore */
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [path]);

  return { connected };
}
