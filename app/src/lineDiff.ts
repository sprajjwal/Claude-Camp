export interface DiffLine {
  type: "same" | "add" | "del";
  text: string;
}

/** Line-by-line diff (longest common subsequence). Fine for the small files lessons use. */
export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i++] });
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) out.push({ type: "del", text: a[i++] });
    else out.push({ type: "add", text: b[j++] });
  }
  while (i < a.length) out.push({ type: "del", text: a[i++] });
  while (j < b.length) out.push({ type: "add", text: b[j++] });
  return out;
}

/** Keep changed lines plus `context` lines around them; runs of hidden lines become one `gap` entry. */
export function withContext(lines: DiffLine[], context = 2): (DiffLine | { type: "gap"; hidden: number })[] {
  const keep = lines.map((l) => l.type !== "same");
  const near = lines.map((_, i) => {
    for (let k = Math.max(0, i - context); k <= Math.min(lines.length - 1, i + context); k++) if (keep[k]) return true;
    return false;
  });
  const out: (DiffLine | { type: "gap"; hidden: number })[] = [];
  lines.forEach((l, i) => {
    if (near[i]) out.push(l);
    else {
      const last = out[out.length - 1];
      if (last && last.type === "gap") last.hidden++;
      else out.push({ type: "gap", hidden: 1 });
    }
  });
  return out;
}
