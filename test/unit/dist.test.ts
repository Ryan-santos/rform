import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * O `@nuxt/module-builder` publica exatamente duas coisas: o bundle rollup de
 * `src/module` e o mkdist de `src/runtime/`. Nada mais da raiz de `src/` chega ao
 * `dist` — foi por isso que o `style.css` teve de descer para `src/runtime/`, e é
 * o que fez o `#rform/types` apontar para um `dist/type` inexistente na `0.1.1`
 * (issue #2). Nada disso aparece rodando o repo, porque os playgrounds carregam o
 * módulo por caminho relativo e enxergam o layout do fonte.
 */

const ROOT = path.join(import.meta.dirname, "..", "..");
const RUNTIME = path.join(ROOT, "src", "runtime");

const exists = async (file: string) => {
    try {
        await stat(file);

        return true;
    } catch {
        return false;
    }
};

/** O alvo de um `resolve(…)`, que sai sem extensão do jeito que o kit o escreve. */
const resolves = async (target: string) => {
    for (const suffix of ["", ".ts", ".d.ts", ".vue", ".css", ".mjs", ".js"]) {
        if (await exists(`${target}${suffix}`)) {
            return true;
        }
    }

    return false;
};

const sources = async (dir: string): Promise<string[]> => {
    const found: string[] = [];

    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            found.push(...(await sources(full)));
        } else if (/\.(ts|vue)$/.test(entry.name)) {
            found.push(full);
        }
    }

    return found;
};

/** Verdadeiro quando `file` mora dentro de `src/runtime/`. */
const inRuntime = (file: string) => !path.relative(RUNTIME, file).startsWith("..");

describe("o que o app instalado alcança mora sob src/runtime", () => {
    it("todo `resolve(…)` do module.ts aponta para dentro de runtime/, e o alvo existe", async () => {
        const source = await readFile(path.join(ROOT, "src", "module.ts"), "utf8");
        const targets = [...source.matchAll(/\bresolve\(\s*"([^"]+)"/g)].map(([, id]) => id!);

        expect(targets.length).toBeGreaterThan(0);

        const outside = targets.filter((id) => !/^runtime[/\\]/.test(id));
        const missing: string[] = [];

        for (const id of targets) {
            if (!(await resolves(path.join(ROOT, "src", id)))) {
                missing.push(id);
            }
        }

        expect({ outside, missing }).toEqual({ outside: [], missing: [] });
    });

    it("nenhum import relativo de src/runtime escapa de src/runtime", async () => {
        const escapes: string[] = [];

        for (const file of await sources(RUNTIME)) {
            const text = await readFile(file, "utf8");

            for (const [, id] of text.matchAll(/from\s+["'](\.[^"']*)["']/g)) {
                const target = path.resolve(path.dirname(file), id!);

                if (!inRuntime(target)) {
                    escapes.push(`${path.relative(ROOT, file)} -> ${id}`);
                }
            }
        }

        expect(escapes).toEqual([]);
    });

    it("enxerga um alvo fora de runtime quando ele existe", () => {
        const targets = [...`resolve("type")`.matchAll(/\bresolve\(\s*"([^"]+)"/g)].map(
            ([, id]) => id!
        );

        expect(targets.filter((id) => !/^runtime[/\\]/.test(id))).toEqual(["type"]);
    });
});