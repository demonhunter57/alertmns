import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", email: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.username, form.password);
      } else {
        await register(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>A</div>
          <span className={styles.logoText}>AlertMNS</span>
        </div>
        <p className={styles.tagline}>Messagerie interne sécurisée</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.modeSwitch}>
            <button type="button" className={mode === "login" ? styles.modeActive : styles.modeBtn} onClick={() => setMode("login")}>Connexion</button>
            <button type="button" className={mode === "register" ? styles.modeActive : styles.modeBtn} onClick={() => setMode("register")}>Inscription</button>
          </div>

          {mode === "register" && (
            <>
              <div className={styles.field}>
                <label>Nom affiché</label>
                <input type="text" value={form.displayName} onChange={set("displayName")} placeholder="Sofia Alvarez" autoComplete="name" />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="sofia@mns.fr" autoComplete="email" required />
              </div>
            </>
          )}

          <div className={styles.field}>
            <label>Identifiant</label>
            <input type="text" value={form.username} onChange={set("username")} placeholder="sofia" autoComplete="username" required />
          </div>
          <div className={styles.field}>
            <label>Mot de passe</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? "Chargement…" : mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        </form>

        <p className={styles.hint}>
          Comptes de démo&nbsp;: <code>admin / admin123</code> ou <code>sofia / user123</code>
        </p>
      </div>
    </div>
  );
}
