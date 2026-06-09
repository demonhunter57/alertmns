import { useRef, useEffect, useState } from "react";
import { useMessages } from "../hooks/useMessages";
import MessageItem from "./MessageItem";
import ExportMenu from "./ExportMenu";
import styles from "./ChatArea.module.css";

export default function ChatArea({ channel, currentUser, allUsers }) {
  const { messages, loading, typingUsers, sendMessage, deleteMessage, reactMessage, startTyping } = useMessages(channel.id);
  const [draft, setDraft] = useState("");
  const [showExport, setShowExport] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingUsers.length]);

  const absent = allUsers.find((u) => channel.memberIds?.includes(u.id) && u.absentUntil && u.id !== currentUser?.id);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
    textareaRef.current?.focus();
  };

  const handleInput = (e) => {
    setDraft(e.target.value);
    startTyping();
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className={styles.area}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.chanInfo}>
          {channel.isPrivate ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={styles.chanIcon} aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          ) : (
            <span className={styles.chanHash}>#</span>
          )}
          <span className={styles.chanName}>{channel.name}</span>
          {channel.description && (
            <span className={styles.chanDesc}>{channel.description}</span>
          )}
        </div>
        <div className={styles.topActions}>
          <button className={styles.topBtn} onClick={() => setShowExport((v) => !v)} title="Exporter la conversation" aria-label="Exporter">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exporter
          </button>
        </div>
        {showExport && (
          <ExportMenu channelId={channel.id} channelName={channel.name} onClose={() => setShowExport(false)} />
        )}
      </div>

      {/* Bannière absent */}
      {absent && (
        <div className={styles.absentBanner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>
            <strong>{absent.displayName}</strong> est absent·e jusqu'au{" "}
            {new Date(absent.absentUntil).toLocaleDateString("fr-FR")}
            {absent.absentMessage && ` — "${absent.absentMessage}"`}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className={styles.messages} role="log" aria-live="polite" aria-label="Messages">
        {loading && <div className={styles.loading}>Chargement…</div>}

        {!loading && messages.length === 0 && (
          <div className={styles.emptyChannel}>
            <div className={styles.emptyIcon}>#</div>
            <p>Bienvenue dans <strong>#{channel.name}</strong></p>
            <p className={styles.emptyHint}>Envoie le premier message !</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const isGrouped =
            prev &&
            prev.authorId === msg.authorId &&
            new Date(msg.createdAt) - new Date(prev.createdAt) < 5 * 60000;

          return (
            <MessageItem
              key={msg.id}
              message={msg}
              grouped={isGrouped}
              currentUser={currentUser}
              allUsers={allUsers}
              onDelete={deleteMessage}
              onReact={reactMessage}
            />
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className={styles.typing} aria-live="polite">
            <span className={styles.typingDots}><span/><span/><span/></span>
            <span>
              {typingUsers.map((u) => u.displayName).join(", ")}{" "}
              {typingUsers.length === 1 ? "est en train d'écrire" : "écrivent"}…
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className={styles.compose}>
        <div className={styles.composeBox}>
          <div className={styles.composeTools}>
            <button className={styles.toolBtn} title="Pièce jointe" aria-label="Joindre un fichier">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <button className={styles.toolBtn} title="Mentionner" aria-label="Mentionner quelqu'un">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
              </svg>
            </button>
            <button className={styles.toolBtn} title="Emoji" aria-label="Ajouter un emoji">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
            <button className={styles.toolBtn} title="Code" aria-label="Insérer du code">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </button>
          </div>
          <div className={styles.composeRow}>
            <textarea
              ref={textareaRef}
              className={styles.composeInput}
              value={draft}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={`Message dans #${channel.name}…`}
              rows={1}
              aria-label={`Écrire un message dans #${channel.name}`}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!draft.trim()}
              aria-label="Envoyer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
