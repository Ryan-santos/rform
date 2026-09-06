/**
 * Os demos são arquivos `.vue` de verdade em `app/demos/<Componente>/<id>.vue`,
 * e não recorte de regex do fonte da página: dois globs sobre a mesma pasta dão
 * o componente para montar e o texto para mostrar, então o código na tela é
 * literalmente o que rodou — e passa por `vue-tsc` como qualquer outro arquivo.
 */
import type { Component } from "vue";

const components = import.meta.glob<{ default: Component }>("../demos/**/*.vue");

const sources = import.meta.glob<string>("../demos/**/*.vue", {
    query: "?raw",
    import: "default"
});

const key = (src: string) => `../demos/${src}.vue`;

/** `"Text/basico"` → o loader do `app/demos/Text/basico.vue`. */
export const demoComponent = (src: string) => components[key(src)];

/** `"Text/basico"` → o loader do texto cru do mesmo arquivo. */
export const demoSource = (src: string) => sources[key(src)];

/** Os `src` que existem, para o `<Demo>` avisar em vez de renderizar vazio. */
export const demoNames = () =>
    Object.keys(components).map((path) => path.slice("../demos/".length, -".vue".length));

function dedent(lines: string[]): string[] {
    const indent = lines
        .filter((line) => line.trim())
        .reduce(
            (min, line) => Math.min(min, line.length - line.trimStart().length),
            Number.POSITIVE_INFINITY
        );

    const strip = Number.isFinite(indent) ? indent : 0;

    return lines.map((line) => line.slice(strip));
}

const trim = (lines: string[]): string[] => {
    while (lines.length > 0 && !lines[0]?.trim()) {
        lines.shift();
    }

    while (lines.length > 0 && !lines.at(-1)?.trim()) {
        lines.pop();
    }

    return lines;
};

/**
 * O que o painel de código mostra. Sem `<script>` — o caso comum — só o miolo do
 * `<template>`, desindentado; com script, o arquivo inteiro, porque a lógica é
 * metade do exemplo.
 *
 * @example demoSourceOf("<template>\n    <RText />\n</template>") // → "<RText />"
 */
export function demoSourceOf(raw: string): string {
    const source = raw.replace(/\r\n/g, "\n").trimEnd();

    if (/<script[\s>]/.test(source)) {
        return source;
    }

    const start = source.indexOf("<template>");
    const end = source.lastIndexOf("</template>");

    if (start === -1 || end <= start) {
        return source;
    }

    return dedent(trim(source.slice(start + "<template>".length, end).split("\n"))).join("\n");
}