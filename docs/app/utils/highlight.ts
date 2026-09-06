/**
 * Realce de sintaxe pelo [shiki](https://shiki.style), com o tema do editor —
 * Shades of Purple (Super Dark), em `assets/shiki/shades-of-purple.json`.
 *
 * São dois highlighters, e a divisa é quem pinta no browser. O painel de model
 * repinta a cada tecla, então `json` tem de estar no bundle; `vue` e `ts` são
 * pintados no server e o HTML deles chega pelo payload (ver `DemoCode.vue`).
 */
import { createJavaScriptRawEngine } from "@shikijs/engine-javascript/raw";
import json from "@shikijs/langs-precompiled/json";
import { createHighlighterCoreSync, type HighlighterCore } from "shiki/core";

import { shikiTheme, themeName } from "../assets/shiki";

export type Lang = "vue" | "ts" | "json";

const themes = [shikiTheme];

/**
 * Gramática **pré-compilada** e motor `raw`: sem o compilador de regex, o par
 * custa ~6 kB e é síncrono. Só serve para `json` — a versão pré-compilada de
 * `vue` está quebrada (marca `<RText` como `invalid.illegal`), a de `json` é
 * idêntica, token a token, ao que o oniguruma produz.
 */
const inline = createHighlighterCoreSync({
    themes,
    langs: [json],
    engine: createJavaScriptRawEngine()
});

let heavy: HighlighterCore | undefined;

/**
 * `vue` e `ts` vão de gramática normal e motor que compila regex — a de `vue`
 * arrasta ts, js, css e html, e nada disso cabe no bundle do browser. Os dois
 * ficam atrás de `import()` por isso.
 */
async function full(): Promise<HighlighterCore> {
    if (!heavy) {
        const [{ createJavaScriptRegexEngine }, vue, ts] = await Promise.all([
            import("@shikijs/engine-javascript"),
            import("shiki/langs/vue.mjs"),
            import("shiki/langs/typescript.mjs")
        ]);

        heavy = createHighlighterCoreSync({
            themes,
            langs: [vue.default, ts.default],
            engine: createJavaScriptRegexEngine({ forgiving: true })
        });
    }

    return heavy;
}

const ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
};

/** Um `.vue` de verdade abre num destes; o resto é recorte de template. */
const SFC = /^\s*<(?:template|script|style)[\s>]/;

/**
 * O fonte de um demo sem `<script>` é o **miolo** do `<template>`, e para o
 * shiki isso não é um SFC: sem dizer onde estamos, ele casa o primeiro elemento
 * como se fosse o bloco de topo e larga o resto sem escopo — o segundo campo do
 * demo sai branco. `grammarContextCode` é o que a gramática precisa ouvir.
 */
const context = (code: string, lang: Lang) =>
    lang === "vue" && !SFC.test(code) ? "<template>" : undefined;

// `structure: "inline"` devolve só os `<span>` dos tokens, com as linhas
// separadas por `<br>`: o `<pre>` e o fundo são do `DemoCode`.
const render = (shiki: HighlighterCore, code: string, lang: Lang) =>
    shiki.codeToHtml(code, {
        lang,
        theme: themeName,
        structure: "inline",
        grammarContextCode: context(code, lang)
    });

/** O fallback de todo caminho: texto cru, sem cor, mas sem quebrar a página. */
export const escapeHtml = (value: string) =>
    value.replace(/[&<>]/g, (char) => ENTITIES[char] as string);

/** A gramática viaja no bundle, e portanto o browser pinta sozinho? */
export const bundled = (lang: Lang) => lang === "json";

/**
 * Pinta agora — exige uma gramática que esteja no bundle, e é o caminho do
 * painel de model. Para o resto devolve o texto escapado.
 *
 * @example paint('{ "a": 1 }', "json") // → '<span style="color:#E1EFFF">{</span>…'
 */
export const paint = (code: string, lang: Lang) =>
    bundled(lang) ? render(inline, code, lang) : escapeHtml(code);

/** Pinta carregando a gramática se preciso — o caminho de `vue` e de `ts`. */
export async function highlight(code: string, lang: Lang): Promise<string> {
    return bundled(lang) ? paint(code, lang) : render(await full(), code, lang);
}