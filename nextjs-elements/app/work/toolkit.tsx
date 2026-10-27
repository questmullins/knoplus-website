import { toolIcons } from "@/data/tool-icons";
import type { ToolGroup } from "@/data/toolkit";
import s from "./toolkit.module.css";

// The Experience / Toolkit list: one tile per program, grouped, with a monogram where there's no logo.
export function Toolkit({ groups }: { groups: ToolGroup[] }) {
  const count = groups.reduce((total, group) => total + group.tools.length, 0);
  return <div className={s.toolkit}>
    <p className={s.count}>{count} tools / {groups.length} groups / scroll to see them all</p>
    {groups.map(group => <section key={group.name} className={s.group} aria-label={group.name}>
      <h2>{group.name}<span>{group.tools.length}</span></h2>
      <ul>{group.tools.map(tool => <li key={tool.name}>
        <span className={s.icon} aria-hidden="true">{tool.icon && toolIcons[tool.icon]
          ? <svg viewBox="0 0 24 24"><path d={toolIcons[tool.icon]} /></svg>
          : <span className={s.mark}>{tool.mark}</span>}</span>
        <span className={s.name}>{tool.name}</span>
      </li>)}</ul>
    </section>)}
  </div>;
}
