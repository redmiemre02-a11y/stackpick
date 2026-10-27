"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tool } from "@/lib/types";

export default function CompareSelector({ tools }: { tools: Tool[] }) {
  const router = useRouter();
  const [toolA, setToolA] = useState(tools[0]?.slug || "");
  const [toolB, setToolB] = useState(tools[1]?.slug || "");

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolA || !toolB || toolA === toolB) return;
    const [first, second] = [toolA, toolB].sort();
    router.push(`/compare/${first}-vs-${second}`);
  };

  return (
    <form className="compare-picker-box" onSubmit={handleCompare}>
      <div className="picker-field">
        <label htmlFor="toolA">First Tool</label>
        <select
          id="toolA"
          value={toolA}
          onChange={(e) => setToolA(e.target.value)}
          className="picker-select"
        >
          {tools.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name} ({t.category})
            </option>
          ))}
        </select>
      </div>

      <div className="picker-vs">VS</div>

      <div className="picker-field">
        <label htmlFor="toolB">Second Tool</label>
        <select
          id="toolB"
          value={toolB}
          onChange={(e) => setToolB(e.target.value)}
          className="picker-select"
        >
          {tools.map((t) => (
            <option key={t.slug} value={t.slug} disabled={t.slug === toolA}>
              {t.name} ({t.category})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="btn primary picker-btn"
        disabled={toolA === toolB}
      >
        Compare Now ⚡
      </button>
    </form>
  );
}
