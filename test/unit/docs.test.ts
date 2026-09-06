import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { demoSourceOf } from "../../docs/app/utils/demos";

const root = fileURLToPath(new URL("../..", import.meta.url));

const content = join(root, "docs/content");

const demos = join(root, "docs/app/demos");

/** Todo `.md` de uma árvore de conteúdo, com o caminho relativo à raiz do locale. */
async function pages(locale: string): Promise<string[]> {
    const walk = async (dir: string, prefix: string): Promise<string[]> => {
        const entries = await readdir(join(content, locale, dir), { withFileTypes: true });

        const found = await Promise.all(
            entries.map(async (entry) => {
                const path = prefix ? `${prefix}/${entry.name}` : entry.name;

                if (entry.isDirectory()) {
                    return walk(join(dir, entry.name), path);
                }

                return entry.name.endsWith(".md") ? [path] : [];
            })
        );

        return found.flat();
    };

    return (await walk("", "")).sort();
}

/** Todo `<Componente>/<id>` que existe em `docs/app/demos`. */
async function available(): Promise<Set<string>> {
    const dirs = await readdir(demos, { withFileTypes: true });

    const found = await Promise.all(
        dirs
            .filter((entry) => entry.isDirectory())
            .map(async (entry) =>
                (await readdir(join(demos, entry.name)))
                    .filter((file) => file.endsWith(".vue"))
                    .map((file) => `${entry.name}/${file.slice(0, -".vue".length)}`)
            )
    );

    return new Set(found.flat());
}

/**
 * Bloco cercado e código inline saem antes: a própria página de contribuição
 * mostra `::demo{src="Componente/id"}` como exemplo da sintaxe, e ele não é uma
 * referência a resolver.
 */
const prose = (source: string) => source.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");

/** Todo `src` citado num `::demo{…}` do conteúdo, com a página que o cita. */
async function referenced(): Promise<{ page: string; src: string }[]> {
    const all: { page: string; src: string }[] = [];

    for (const locale of ["pt", "en"]) {
        for (const page of await pages(locale)) {
            const source = prose(await readFile(join(content, locale, page), "utf8"));

            for (const match of source.matchAll(/::demo\{[^}]*src="([^"]+)"/g)) {
                all.push({ page: `${locale}/${page}`, src: match[1] as string });
            }
        }
    }

    return all;
}

describe("demoSourceOf", () => {
    it("desembrulha o `<template>` e desindenta quando não há script", () => {
        const raw = ["<template>", '    <RText name="nome" />', "</template>"].join("\n");

        expect(demoSourceOf(raw)).toBe('<RText name="nome" />');
    });

    it("preserva a indentação relativa entre as linhas", () => {
        const raw = [
            "<template>",
            "    <RArray>",
            '        <RText name="a" />',
            "    </RArray>",
            "</template>"
        ].join("\n");

        expect(demoSourceOf(raw)).toBe(
            ["<RArray>", '    <RText name="a" />', "</RArray>"].join("\n")
        );
    });

    it("devolve o arquivo inteiro quando há `<script setup>`", () => {
        const raw = [
            "<template>",
            "    <RText :rule />",
            "</template>",
            "",
            '<script setup lang="ts">',
            "    const rule = () => undefined;",
            "</script>"
        ].join("\n");

        expect(demoSourceOf(raw)).toBe(raw);
    });

    it("não engole um `</template>` de slot no meio do arquivo", () => {
        const raw = [
            "<template>",
            "    <RText>",
            "        <template #leading> R$ </template>",
            "    </RText>",
            "</template>"
        ].join("\n");

        expect(demoSourceOf(raw)).toBe(
            ["<RText>", "    <template #leading> R$ </template>", "</RText>"].join("\n")
        );
    });
});

describe("paridade pt/en", () => {
    it("toda página de `pt` tem irmã em `en`, e vice-versa", async () => {
        const [pt, en] = await Promise.all([pages("pt"), pages("en")]);

        expect(en).toEqual(pt);
    });

    it("as duas árvores concordam no título de cada seção", async () => {
        const nav = async (locale: string) =>
            (await readdir(join(content, locale), { withFileTypes: true }))
                .filter((entry) => entry.isDirectory())
                .map((entry) => entry.name)
                .sort();

        expect(await nav("en")).toEqual(await nav("pt"));
    });
});

describe("demos", () => {
    it("todo `::demo{src}` aponta para um arquivo que existe", async () => {
        const files = await available();

        const missing = (await referenced())
            .filter(({ src }) => !files.has(src))
            .map(({ page, src }) => `${page} → ${src}`);

        expect(missing).toEqual([]);
    });

    it("todo demo é citado por alguma página", async () => {
        const cited = new Set((await referenced()).map(({ src }) => src));

        const orphans = [...(await available())].filter((src) => !cited.has(src)).sort();

        expect(orphans).toEqual([]);
    });
});