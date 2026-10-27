import type { CSSProperties } from "react";
import { toolIcons } from "@/data/tool-icons";
import type { ToolGroup } from "@/data/toolkit";
import s from "./toolkit.module.css";

// Relative luminance, so near-black logos switch to the ink in dark mode and pale ones darken in light mode.
function tone(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  const luminance = .2126 * r + .7152 * g + .0722 * b;
  return luminance < .045 ? "dark" : luminance > .45 ? "pale" : undefined;
}

// The Experience / Toolkit list: one tile per program in its brand colour, grouped, with a coloured monogram where there's no logo.
export function Toolkit({ groups }: { groups: ToolGroup[] }) {
  const count = groups.reduce((total, group) => total + group.tools.length, 0);
  return <div className={s.toolkit}>
    <p className={s.count}>{count} tools / {groups.length} groups / scroll to see them all</p>
    {groups.map(group => <section key={group.name} className={s.group} aria-label={group.name}>
      <h2>{group.name}<span>{group.tools.length}</span></h2>
      <ul>{group.tools.map(tool => {
        const logo = tool.icon ? toolIcons[tool.icon] : undefined;
        const color = tool.color || logo?.hex || "#5A6472";
        return <li key={tool.name}>
          <span className={s.icon} aria-hidden="true" data-tone={tone(color)} style={{ "--brand": color } as CSSProperties}>{logo
            ? <svg viewBox="0 0 24 24"><path d={logo.path} /></svg>
            : <span className={s.mark}>{tool.mark}</span>}</span>
          <span className={s.name}>{tool.name}</span>
        </li>;
      })}</ul>
    </section>)}
  </div>;
}
