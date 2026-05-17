import { useState, useEffect } from "react";
import { THEME, LANGUAGES } from "../constants.js";
import { tcLoad, tcSave } from "../utils.js";
import { callAI } from "../ai.js";
import { extractJSON } from "../ai.js";

export default function BookCard({ book, count, onClick, users, userLang }) {
  const owner = users.find(u => u.id === book.ownerId);
  const [display, setDisplay] = useState({ name: book.name, description: book.description });

  useEffect(() => {
    const lang = userLang || "en";
    const origLang = book.originalLang || "en";
    if (lang === origLang) { setDisplay({ name: book.name, description: book.description }); return; }
    const cache = tcLoad() || {};
    const ck = `${book.id}__${lang}`;
    if (cache[ck]?.name) { setDisplay({ name: cache[ck].name || book.name, description: cache[ck].description || book.description }); return; }
    const langName = LANGUAGES.find(l => l.code === lang)?.nativeLabel || "English";
    callAI(`Translate into ${langName}, return ONLY valid JSON {name,description}, no markdown: ${JSON.stringify({ name: book.name, description: book.description })}`)
      .then(raw => {
        const j = extractJSON(raw);
        setDisplay({ name: j.name || book.name, description: j.description || book.description });
        const c = tcLoad() || {}; c[ck] = { ...j }; tcSave(c);
      })
      .catch(() => {});
  }, [book.id, userLang]);

  return (
    <div className="card" onClick={onClick}>
      <div className="card-cover">
        {book.coverImage ? <img src={book.coverImage} alt="" /> : <span style={{ fontSize: "3rem" }}>📚</span>}
      </div>
      <div className="card-body">
        <div className="card-name">{display.name}</div>
        {display.description && <div className="card-desc">{display.description}</div>}
        <div className="card-meta" style={{ flexDirection: "column", alignItems: "flex-end", gap: ".1rem" }}>
          <span className="card-creator" style={{ fontSize: ".78rem" }}>{owner?.name || ""}</span>
          <span className="card-count" style={{ fontSize: ".78rem" }}>{count} {count === 1 ? "recipe" : "recipes"}</span>
        </div>
      </div>
    </div>
  );
}
