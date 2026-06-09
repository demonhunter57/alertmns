import { useState } from "react";
import styles from "./MessageItem.module.css";

const EMOJIS = ["👍", "❤️", "😂", "🚀", "👀", "✅"];

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function renderContent(text) {
  // Backtick → code, @mention
  return text
    .replace(/`([^`]+)`/g, (_, code) => `<code>${escHtml(code)}</code>`)
    .replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

function escHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function MessageItem({ message, grouped, currentUser, allUsers, onDelete, onReact }) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const author = message.author || allUsers.find((u) => u.id === message.authorId);
  const isMine = message.authorId === currentUser?.id;

  return (
    <div
      className={`${styles.msg} ${grouped ? styles.grouped : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
    >
      {/* Avatar + meta */}
      {!grouped ? (
        <div className={styles.avatar} style={{ background: (author?.color || "#6366f1") + "22", color: author?.color || "#818cf8" }}>
          {author?.initials || "?"}
        </div>
      ) : (
        <div className={styles.timeGhost}>{formatTime(message.createdAt)}</div>
      )}

      <div className={styles.body}>
        {!grouped && (
          <div className={styles.meta}>
            <span className={styles.author} style={{ color: author?.color || "var(--acc-h)" }}>
              {author?.displayName || "Inconnu"}
            </span>
            {author?.role && author.role !== "user" && (
              <span className={styles.role}>{author.role}</span>
            )}
            <span className={styles.time}>{formatTime(message.createdAt)}</span>
            {message.editedAt && <span className={styles.edited}>(modifié)</span>}
          </div>
        )}

        <div
          className={styles.text}
          dangerouslySetInnerHTML={{ __html: renderContent(escHtml(message.content)) }}
        />

        {/* Réactions */}
        {Object.keys(message.reactions || {}).length > 0 && (
          <div className={styles.reactions}>
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                className={`${styles.reaction} ${userIds.includes(currentUser?.id) ? styles.reactionMine : ""}`}
                onClick={() => onReact(message.id, emoji)}
                title={`${userIds.length} personne${userIds.length > 1 ? "s" : ""}`}
              >
                {emoji} <span>{userIds.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions au survol */}
      {showActions && (
        <div className={styles.actions}>
          <div className={styles.emojiWrap}>
            <button
              className={styles.actionBtn}
              onClick={() => setShowEmojiPicker((v) => !v)}
              title="Réagir"
              aria-label="Ajouter une réaction"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
            {showEmojiPicker && (
              <div className={styles.emojiPicker}>
                {EMOJIS.map((e) => (
                  <button key={e} className={styles.emojiOpt} onClick={() => { onReact(message.id, e); setShowEmojiPicker(false); }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isMine && (
            <button
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={() => onDelete(message.id)}
              title="Supprimer"
              aria-label="Supprimer le message"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
