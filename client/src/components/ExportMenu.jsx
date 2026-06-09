import { useState } from "react";
import { getToken } from "../contexts/AuthContext";
import styles from "./ExportMenu.module.css";

const FORMATS = [
  { id: "json", label: "JSON", icon: "{}", desc: "Données structurées" },
  { id: "csv", label: "CSV", icon: "⊞", desc: "Compatible Excel" },
  { id: "xml", label: "XML", icon: "</>", desc: "Format interopérable" },
  { id: "pdf", label: "PDF", icon: "⬜", desc: "Document imprimable" },
];

export default function ExportMenu({ channelId, channelName, onClose }) {
  const [loading, setLoading] = useState(null);

  const handleExport = async (format) => {
    setLoading(format);
    try {
      if (format === "pdf") {
        await exportPDF(channelId, channelName);
      } else {
        const res = await fetch(`/api/export/${channelId}/${format}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error("Export échoué");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `alertmns-${channelName}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
      onClose();
    }
  };

  return (
    <div className={styles.menu} role="dialog" aria-label="Exporter la conversation">
      <div className={styles.header}>
        Exporter <strong>#{channelName}</strong>
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
      </div>
      <div className={styles.grid}>
        {FORMATS.map((f) => (
          <button
            key={f.id}
            className={styles.formatBtn}
            onClick={() => handleExport(f.id)}
            disabled={loading !== null}
            aria-label={`Exporter en ${f.label}`}
          >
            <span className={styles.fmtIcon}>{f.icon}</span>
            <span className={styles.fmtLabel}>{f.label}</span>
            <span className={styles.fmtDesc}>{loading === f.id ? "Téléchargement…" : f.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Export PDF simple côté client via l'API pdf-data
async function exportPDF(channelId, channelName) {
  const res = await fetch(`/api/export/${channelId}/pdf-data`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();

  // Construction d'un PDF HTML-to-print (sans dépendance lourde)
  const html = `<!DOCTYPE html><html lang="fr"><head>
    <meta charset="UTF-8">
    <title>AlertMNS — #${data.channel.name}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 32px; color: #1e293b; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
      .msg { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
      .author { font-weight: 600; font-size: 13px; color: #3730a3; }
      .time { font-size: 11px; color: #94a3b8; margin-left: 8px; }
      .content { font-size: 13px; color: #334155; margin-top: 3px; }
    </style>
  </head><body>
    <h1>#${data.channel.name}</h1>
    <div class="meta">Exporté le ${new Date(data.exportedAt).toLocaleString("fr-FR")} par ${data.exportedBy} · ${data.messages.length} messages</div>
    ${data.messages.map((m) => `<div class="msg">
      <span class="author">${m.author}</span>
      <span class="time">${new Date(m.createdAt).toLocaleString("fr-FR")}</span>
      <div class="content">${m.content.replace(/</g, "&lt;")}</div>
    </div>`).join("")}
  </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => { win.print(); URL.revokeObjectURL(url); };
  }
}
