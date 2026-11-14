import React from "react";
import { createRoot } from "react-dom/client";
import { PracticeNativeText } from "../../src/components/nafs-practice/PracticeNativeText";
import type { PracticeTextLayout } from "../../src/types/nafs-practice.contract";
import "../../src/index.css";
const data = (await fetch("/native-preview-data.json").then((r) =>
  r.json(),
)) as Array<{ label: string; original: string; layout: PracticeTextLayout }>;
createRoot(document.getElementById("root")!).render(
  <main style={{ padding: 20, background: "white", color: "#222" }}>
    {data.map((d, i) => (
      <article
        key={i}
        style={{
          borderBottom: "1px solid #ddd",
          padding: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <p style={{ gridColumn: "span 2" }}>{d.label}</p>
        <div style={{ overflow: "auto" }}>
          <img
            src={d.original}
            style={{ maxWidth: "100%", maxHeight: 160 }}
            alt="Original source notation"
          />
        </div>
        <div style={{ alignSelf: "center" }}>
          <PracticeNativeText layout={d.layout} />
        </div>
      </article>
    ))}
  </main>,
);
