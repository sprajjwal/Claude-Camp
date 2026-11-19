import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { SANDBOX_DIR, LESSONS_DIR } from "./paths.js";
import { getLesson, listLessons } from "./lessons.js";

let base = "";
const created: string[] = [];

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address() as net.AddressInfo;
      s.close(() => resolve(port));
    });
  });
}

beforeAll(async () => {
  const port = await freePort();
  process.env.PORT = String(port);
  base = `http://127.0.0.1:${port}`;
  await import("./index.js");
  await new Promise((r) => setTimeout(r, 200));
});
afterAll(() => created.forEach((f) => fs.rmSync(f, { force: true })));

const get = (p: string) => fetch(`${base}/api/sandbox-file?path=${encodeURIComponent(p)}`);

describe("GET /api/sandbox-file", () => {
  it("returns content and modified time for an existing file", async () => {
    const name = `.tmp-test-${process.pid}.txt`;
    const file = path.join(SANDBOX_DIR, name);
    fs.writeFileSync(file, "hello\nworld");
    created.push(file);
    const res = await get(name);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content).toBe("hello\nworld");
    expect(body.modified).toBeGreaterThan(0);
  });

  it("returns content null for a missing file", async () => {
    const res = await get("definitely-missing-file.txt");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ content: null, modified: 0 });
  });

  it.each(["../package.json", "../../etc/passwd", "..", ".claude/settings.json", ".claude", "", "."])(
    "rejects %j with 400",
    async (p) => {
      const res = await get(p);
      expect(res.status).toBe(400);
    },
  );

  it("rejects an absolute path outside the sandbox", async () => {
    expect((await get(path.join(SANDBOX_DIR, "..", "package.json"))).status).toBe(400);
  });
});

describe("lesson preview frontmatter", () => {
  const ids = fs.readdirSync(LESSONS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  it.each(ids)("%s has a safe string preview", (id) => {
    const preview = getLesson(id)?.preview;
    expect(typeof preview).toBe("string");
    expect(path.isAbsolute(preview!)).toBe(false);
    expect(preview).not.toContain("..");
    expect(listLessons().map((l) => l.id)).toContain(id);
  });
  it("lessons 01 to 05 exist", () => {
    for (const p of ["01", "02", "03", "04", "05"]) expect(ids.some((i) => i.startsWith(p))).toBe(true);
  });
});
