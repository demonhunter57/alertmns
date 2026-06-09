import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { getToken } from "../contexts/AuthContext";
import { useOnlineUsers } from "../hooks/useOnlineUsers";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import styles from "./ChatPage.module.css";

export default function ChatPage() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected } = useSocket();

  const [channels, setChannels] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(channelId || null);
  const [notifications, setNotifications] = useState([]);

  const users = useOnlineUsers(allUsers);

  // Charger channels + users
  useEffect(() => {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/channels", { headers }).then((r) => r.json()),
      fetch("/api/users", { headers }).then((r) => r.json()),
    ]).then(([chans, usrs]) => {
      const sortedChans = Array.isArray(chans) ? chans : [];
      setChannels(sortedChans);
      setAllUsers(Array.isArray(usrs) ? usrs : []);
      if (!activeChannelId && sortedChans.length > 0) {
        const first = sortedChans[0];
        setActiveChannelId(first.id);
        navigate(`/channel/${first.id}`, { replace: true });
      }
    });
  }, []);

  // Recevoir notifications DM
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setNotifications((prev) => [{ ...notif, id: Date.now() }, ...prev.slice(0, 19)]);
    };
    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [socket]);

  const handleSelectChannel = (id) => {
    setActiveChannelId(id);
    navigate(`/channel/${id}`);
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  return (
    <div className={styles.layout}>
      <Sidebar
        channels={channels}
        users={users}
        activeChannelId={activeChannelId}
        onSelectChannel={handleSelectChannel}
        currentUser={user}
        notifications={notifications}
        connected={connected}
      />
      {activeChannel ? (
        <ChatArea
          channel={activeChannel}
          currentUser={user}
          allUsers={users}
        />
      ) : (
        <div className={styles.empty}>
          <p>Sélectionne un canal pour commencer</p>
        </div>
      )}
    </div>
  );
}
