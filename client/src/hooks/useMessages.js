import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import { getToken } from "../contexts/AuthContext";

export function useMessages(channelId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const { socket } = useSocket();
  const typingTimer = useRef(null);

  // Charger l'historique via REST
  useEffect(() => {
    if (!channelId) return;
    setLoading(true);
    fetch(`/api/messages/${channelId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [channelId]);

  // Écouter les événements WebSocket
  useEffect(() => {
    if (!socket) return;

    const onNew = (msg) => {
      if (msg.channelId !== channelId) return;
      setMessages((prev) => [...prev, msg]);
    };
    const onEdited = (msg) => {
      if (msg.channelId !== channelId) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
    };
    const onDeleted = ({ messageId, channelId: cid }) => {
      if (cid !== channelId) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };
    const onReacted = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    };
    const onTyping = ({ channelId: cid, userId, displayName, typing }) => {
      if (cid !== channelId) return;
      setTypingUsers((prev) => {
        if (typing) return prev.find((u) => u.userId === userId) ? prev : [...prev, { userId, displayName }];
        return prev.filter((u) => u.userId !== userId);
      });
    };

    socket.on("message:new", onNew);
    socket.on("message:edited", onEdited);
    socket.on("message:deleted", onDeleted);
    socket.on("message:reacted", onReacted);
    socket.on("typing:update", onTyping);

    return () => {
      socket.off("message:new", onNew);
      socket.off("message:edited", onEdited);
      socket.off("message:deleted", onDeleted);
      socket.off("message:reacted", onReacted);
      socket.off("typing:update", onTyping);
    };
  }, [socket, channelId]);

  const sendMessage = useCallback(
    (content) => {
      if (!socket || !content.trim()) return;
      socket.emit("message:send", { channelId, content });
      // Arrêter l'indicateur de frappe
      socket.emit("typing:stop", { channelId });
    },
    [socket, channelId]
  );

  const deleteMessage = useCallback(
    (messageId) => socket?.emit("message:delete", { messageId }),
    [socket]
  );

  const reactMessage = useCallback(
    (messageId, emoji) => socket?.emit("message:react", { messageId, emoji }),
    [socket]
  );

  const startTyping = useCallback(() => {
    if (!socket) return;
    socket.emit("typing:start", { channelId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing:stop", { channelId });
    }, 2500);
  }, [socket, channelId]);

  return { messages, loading, typingUsers, sendMessage, deleteMessage, reactMessage, startTyping };
}
