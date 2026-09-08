/**
 * O recorte do fonte de um demo, sem nenhum `import.meta.glob` — separado do
 * `demos.ts` porque o gerador do MCP (`docs/modules/mcp/data.ts`) é Node puro e não
 * consegue importar um arquivo que depende da transformação do Vite. Assim o
 * MCP entrega byte a byte o que o `<DemoCode>` mostra.
 */
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