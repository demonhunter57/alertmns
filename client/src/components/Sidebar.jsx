import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Sidebar.module.css";

const STATUS_DOT = { online: "#22c55e", away: "#f59e0b", offline: "#475569" };

export default function Sidebar({ channels, users, activeChannelId, onSelectChannel, currentUser, notifications, connected }) {
  const { logout } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState("");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const otherUsers = users.filter((u) => u.id !== currentUser?.id);

  return (
    <aside className={styles.sidebar}>
      {/* Header org */}
      <div className={styles.header}>
        <div className={styles.org}>
          <span className={styles.orgDot} style={{ background: connected ? "#22c55e" : "#ef4444" }} title={connected ? "Connecté" : "Déconnecté"} />
          <span className={styles.orgName}>MNS — Metz Numeric School</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={() => setShowNotifs((v) => !v)} title="Notifications" aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
          <button className={styles.iconBtn} onClick={logout} title="Déconnexion" aria-label="Déconnexion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Panneau notifications */}
      {showNotifs && (
        <div className={styles.notifPanel}>
          <div className={styles.notifHeader}>
            Notifications
            <button className={styles.notifClear} onClick={() => setShowNotifs(false)}>Fermer</button>
          </div>
          {notifications.length === 0 ? (
            <p className={styles.notifEmpty}>Aucune notification</p>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <div key={n.id} className={styles.notifItem}>
                <Avatar user={n.from} size={28} />
                <div className={styles.notifBody}>
                  <span className={styles.notifWho}>{n.from?.displayName}</span>
                  <span className={styles.notifWhat}>{n.content}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recherche */}
      <div className={styles.search}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.scroll}>
        {/* Canaux */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            Canaux
            <button className={styles.addBtn} title="Nouveau canal" aria-label="Nouveau canal">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          {filteredChannels.map((ch) => (
            <button
              key={ch.id}
              className={`${styles.channelItem} ${activeChannelId === ch.id ? styles.active : ""}`}
              onClick={() => onSelectChannel(ch.id)}
            >
              {ch.isPrivate ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={styles.chIcon} aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ) : (
                <span className={styles.chHash}>#</span>
              )}
              <span className={styles.chName}>{ch.name}</span>
            </button>
          ))}
        </div>

        {/* Messages directs */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            Messages directs
            <button className={styles.addBtn} title="Nouveau message" aria-label="Nouveau message">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          {otherUsers.map((u) => (
            <div key={u.id} className={styles.dmItem}>
              <div className={styles.dmAv} style={{ background: u.color + "22", color: u.color }}>
                {u.initials}
                <span className={styles.statusDot} style={{ background: STATUS_DOT[u.status] || STATUS_DOT.offline }} />
              </div>
              <span className={styles.dmName}>{u.displayName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Profil bas */}
      <div className={styles.profile}>
        <div className={styles.profileAv} style={{ background: currentUser?.color + "22", color: currentUser?.color }}>
          {currentUser?.initials}
          <span className={styles.statusDot} style={{ background: "#22c55e" }} />
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{currentUser?.displayName}</span>
          <span className={styles.profileRole}>{currentUser?.role}</span>
        </div>
      </div>
    </aside>
  );
}

function Avatar({ user, size = 32 }) {
  if (!user) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: "8px",
      background: (user.color || "#6366f1") + "22",
      color: user.color || "#818cf8",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 500, flexShrink: 0,
    }}>
      {user.initials || "?"}
    </div>
  );
}
