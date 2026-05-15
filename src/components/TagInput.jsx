import { useState } from "react";

export default function TagInput({ value = [], onChange, placeholder = "" }) {
  const [inp, setInp] = useState("");
  const add = () => { const v = inp.trim(); if (v && !value.includes(v)) onChange([...value, v]); setInp(""); };
  return (
    <div className="tag-wrap" onClick={e => e.currentTarget.querySelector("input").focus()}>
      {value.map(t => (
        <span key={t} className="tpill">{t}
          <button type="button" onClick={() => onChange(value.filter(x => x !== t))}>×</button>
        </span>
      ))}
      <input value={inp} onChange={e => setInp(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add} placeholder={value.length === 0 ? placeholder : ""} />
    </div>
  );
}
