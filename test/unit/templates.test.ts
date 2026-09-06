import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Tipagem não entra no `<template>` — ver "Tipagem não entra no template" no
 * `.claude/CLAUDE.md`. O cast some do olhar de quem lê o markup, o `vue-tsc` o
 * checa num lugar onde ninguém procura, e num demo do site ele vira exemplo.
 */

const ROOTS = [
    path.join("src", "runtime", "components"),
    path.join("docs", "app"),
    path.join("playgrounds", "i18n", "app"),
    path.join("playgrounds", "basic", "app"),
    path.join("playgrounds", "standalone", "app"),
    path.join("playgrounds", "ui", "app"),
    path.join("test", "fixtures", "basic", "rform")
];

const IGNORED = new Set(["node_modules", ".nuxt", ".output", "dist"]);

const files = async (root: string): Promise<string[]> => {
    const found: string[] = [];

    for (const entry of await readdir(root, { withFileTypes: true })) {
        if (IGNORED.has(entry.name)) {
            continue;
        }

        const full = path.join(root, entry.name);

        if (entry.isDirectory()) {
            found.push(...(await files(full)));
        } else if (entry.name.endsWith(".vue")) {
            found.push(full);
        }
    }

    return found;
};

/** O miolo do `<template>` de topo, linha a linha, com o número de linha real. */
const templateLines = (text: string) => {
    const lines = text.split(/\r?\n/);
    const open = lines.findIndex((line) => line.trim().startsWith("<template>"));

    if (open === -1) {
        return [];
    }

    // O fechamento de topo é o único sem indentação; um `</template>` de slot vem
    // recuado.
    const close = lines.findIndex((line, index) => index > open && line === "</template>");

    return lines
        .slice(open + 1, close === -1 ? lines.length : close)
        .map((line, index) => ({ line, number: open + index + 2 }));
};

const OFFENDERS = [
    /\bas\s+(?:unknown|const|[A-Z][\w.]*)/,
    /\bsatisfies\s+[A-Z]/,
    // Anotação no escopo de um slot: `#[name]="scope: Scope"`, `v-slot="{ x }: T"`.
    /(?:#\[?[\w.]+\]?|v-slot(?::[\w[\]]+)?)="[^"]*:\s*[A-Z]/
];

describe("tipagem não entra no template", () => {
    it("não há cast, `satisfies` nem anotação de slot em nenhum `.vue`", async () => {
        const offenses: string[] = [];

        for (const root of ROOTS) {
            for (const file of await files(root)) {
                const text = await readFile(file, "utf8");

                for (const { line, number } of templateLines(text)) {
                    if (OFFENDERS.some((pattern) => pattern.test(line))) {
                        offenses.push(`${file}:${number}: ${line.trim()}`);
                    }
                }
            }
        }

        expect(offenses).toEqual([]);
    });

    it("enxerga um cast quando ele existe", () => {
        const sample = [
            "<template>",
            '    <RDynamic :schema="props.schema as Schema" />',
            "</template>"
        ].join("\n");

        const found = templateLines(sample).filter(({ line }) =>
            OFFENDERS.some((pattern) => pattern.test(line))
        );

        expect(found).toHaveLength(1);
        expect(found[0]!.number).toBe(2);
    });

    it("não confunde `as` de v-for nem chave maiúscula de objeto", () => {
        const sample = [
            "<template>",
            '    <div v-for="(item, key) in list" :class="{ Utils: true }">',
            '        <span :aria-label="asLabel">{{ item }}</span>',
            "    </div>",
            "</template>"
        ].join("\n");

        const found = templateLines(sample).filter(({ line }) =>
            OFFENDERS.some((pattern) => pattern.test(line))
        );

        expect(found).toEqual([]);
    });
});