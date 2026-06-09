import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getToken } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children, enabled }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;

    const socket = io("http://localhost:4000", {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("[WS] connecté:", socket.id);
    });
    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.log("[WS] déconnecté:", reason);
    });
    socket.on("connect_error", (err) => {
      console.error("[WS] erreur:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
