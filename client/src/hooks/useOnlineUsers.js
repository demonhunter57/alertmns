import { useState, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";

export function useOnlineUsers(initialUsers = []) {
  const [users, setUsers] = useState(initialUsers);
  const { socket } = useSocket();

  useEffect(() => {
    setUsers(initialUsers);
  }, [JSON.stringify(initialUsers)]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId, status, absentUntil, absentMessage }) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status, absentUntil, absentMessage } : u
        )
      );
    };
    socket.on("user:status", handler);
    return () => socket.off("user:status", handler);
  }, [socket]);

  return users;
}
