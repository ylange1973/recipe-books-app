import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase.js";
import { fbGetUser, fbSaveUser } from "../firestore.js";
import { THEME, T } from "../constants.js";

export default function LoginScreen({ onLogin }) {
  const t = T.en;
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setErr(""); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pw);
      const userData = await fbGetUser(cred.user.uid);
      onLogin(userData || { id: cred.user.uid, name: cred.user.displayName || email, email, lang: "en" });
    } catch (e) { setErr(e.message || t.wrongLogin); }
    setLoading(false);
  }

  async function handleRegister() {
    if (!name.trim()) { setErr("Please enter your name."); return; }
    setErr(""); setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      await updateProfile(cred.user, { displayName: name });
      const userData = { id: cred.user.uid, name, email, lang: "en" };
      await fbSaveUser(userData);
      onLogin(userData);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">📚 {t.appName}</div>
        <div className="login-sub">{t.tagline}</div>
        <div style={{ display: "flex", marginBottom: "1.5rem", borderRadius: 8, overflow: "hidden", border: `1.5px solid ${THEME.tan}` }}>
          {["login", "register"].map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setErr(""); }}
              style={{ flex: 1, padding: ".5rem", border: "none", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif", fontSize: ".88rem", fontWeight: 500, background: mode === m ? THEME.brown : "white", color: mode === m ? "white" : THEME.brown }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
        {mode === "register" && <div className="field"><label>Your Name</label><input className="fi" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah" onKeyDown={e => e.key === "Enter" && handleRegister()} /></div>}
        <div className="field"><label>{t.email}</label><input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())} /></div>
        <div className="field"><label>{t.password}</label><input className="fi" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••" onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())} /></div>
        {err && <div style={{ color: THEME.rust, fontSize: ".82rem", marginBottom: ".8rem" }}>{err}</div>}
        <button className="btn btn-p" style={{ width: "100%", justifyContent: "center", padding: ".7rem" }} onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading}>
          {loading ? "…" : mode === "login" ? t.signIn : "Create Account"}
        </button>
      </div>
    </div>
  );
}
