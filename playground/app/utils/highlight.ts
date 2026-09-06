/**
 * Realce de sintaxe sem dependência: os blocos do playground são sempre recorte
 * de Vue, recorte de TS ou JSON de saída, então três gramáticas cobrem tudo. As
 * cores moram nas classes `.tok-*` de `assets/css/main.css`.
 */

export type Lang = "vue" | "ts" | "json";

const ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
};

export const escapeHtml = (value: string) =>
    value.replace(/[&<>]/g, (char) => ENTITIES[char] as string);

/**
 * As regras são regex de verdade, não string de regex: o `source` é lido na hora
 * de montar a alternância, e assim nenhuma barra invertida precisa ser dobrada.
 */
type Grammar = { token: string; re: RegExp }[];

/**
 * Uma passada só, com todas as regras num único regex: a alternância é ordenada,
 * então comentário e string vêm primeiro e nada casa dentro deles.
 */
function paint(source: string, grammar: Grammar): string {
    if (!source) {
        return "";
    }

    const regex = new RegExp(
        grammar.map(({ re }, index) => `(?<t${index}>${re.source})`).join("|"),
        "gs"
    );

    let html = "";
    let last = 0;

    for (const match of source.matchAll(regex)) {
        const at = match.index ?? 0;
        const hit = grammar.findIndex((_, index) => match.groups?.[`t${index}`] !== undefined);

        html += escapeHtml(source.slice(last, at));
        html += `<span class="tok-${grammar[hit]?.token}">${escapeHtml(match[0])}</span>`;

        last = at + match[0].length;
    }

    return html + escapeHtml(source.slice(last));
}

const ts: Grammar = [
    { token: "comment", re: /\/\/[^\n]*|\/\*.*?\*\// },
    { token: "string", re: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/ },
    {
        token: "keyword",
        re: /\b(?:as|async|await|const|default|else|export|extends|from|function|if|import|interface|let|new|readonly|return|type|typeof|var|void)\b/
    },
    { token: "literal", re: /\b(?:true|false|null|undefined)\b/ },
    { token: "fn", re: /\b[A-Za-z_$][\w$]*(?=\s*[(<])/ },
    { token: "prop", re: /\b[A-Za-z_$][\w$]*(?=\s*:)/ },
    { token: "number", re: /\b\d[\d_]*(?:\.\d+)?\b/ },
    { token: "punct", re: /=>|[{}()[\];,]/ }
];

const json: Grammar = [
    { token: "comment", re: /\/\/[^\n]*/ },
    { token: "key", re: /"(?:\\.|[^"\\])*"(?=\s*:)/ },
    { token: "string", re: /"(?:\\.|[^"\\])*"/ },
    { token: "literal", re: /\b(?:true|false|null)\b/ },
    { token: "number", re: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/ },
    { token: "punct", re: /[{}[\],:]/ }
];

const text: Grammar = [{ token: "interp", re: /\{\{.*?\}\}/ }];

const TAG_NAME = /^<\/?[A-Za-z][\w.-]*/;

const ATTR = /([@:#.]?[A-Za-z_][\w.:\-[\]]*)(\s*=\s*(?:"[^"]*"|'[^']*'))?/g;

const BOUND = /^[@:]|^v-/;

/** `>` e `/>` do gap entre atributos, já sobre o texto escapado. */
const closers = (value: string) =>
    escapeHtml(value).replace(/\/?&gt;/g, (match) => `<span class="tok-punct">${match}</span>`);

/**
 * Anda até o `>` que fecha a tag, pulando os que moram dentro de valor de
 * atributo — `:rule="({ value }) => value"` carrega dois.
 */
function endOfTag(source: string, from: number): number {
    let quote: string | null = null;

    for (let index = from; index < source.length; index++) {
        const char = source[index];

        if (quote) {
            if (char === quote) {
                quote = null;
            }

            continue;
        }

        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }

        if (char === ">") {
            return index;
        }
    }

    return -1;
}

function paintTag(chunk: string): string {
    const name = TAG_NAME.exec(chunk);

    if (!name) {
        return closers(chunk);
    }

    let html = `<span class="tok-tag">${escapeHtml(name[0])}</span>`;

    /**
     * `match.index` é relativo ao pedaço fatiado, então o deslocamento é o do
     * corte — somar `last`, que anda a cada atributo, embaralharia as posições.
     */
    const start = name[0].length;

    let last = start;

    for (const match of chunk.slice(start).matchAll(ATTR)) {
        const at = start + (match.index ?? 0);

        html += closers(chunk.slice(last, at));
        html += `<span class="tok-attr">${escapeHtml(match[1] as string)}</span>`;

        if (match[2]) {
            const raw = match[2].replace(/^\s*=\s*/, "");
            const gap = match[2].slice(0, match[2].length - raw.length);
            const quote = raw.slice(0, 1);
            const inner = raw.slice(1, -1);

            html += `<span class="tok-punct">${escapeHtml(gap)}</span>`;

            if (BOUND.test(match[1] as string)) {
                /** Valor de prop ligada é expressão: vale pintar como TS. */
                html += `<span class="tok-string">${quote}</span>`;
                html += paint(inner, ts);
                html += `<span class="tok-string">${quote}</span>`;
            } else {
                html += `<span class="tok-string">${escapeHtml(raw)}</span>`;
            }
        }

        last = at + match[0].length;
    }

    return html + closers(chunk.slice(last));
}

/**
 * Template Vue é varrido à mão em vez de por regex: assim um nome de atributo
 * nunca é confundido com uma palavra qualquer do texto entre as tags.
 */
function paintVue(source: string): string {
    let html = "";
    let index = 0;

    while (index < source.length) {
        const open = source.indexOf("<", index);

        if (open === -1) {
            html += paint(source.slice(index), text);
            break;
        }

        html += paint(source.slice(index, open), text);

        if (source.startsWith("<!--", open)) {
            const end = source.indexOf("-->", open);
            const stop = end === -1 ? source.length : end + 3;

            html += `<span class="tok-comment">${escapeHtml(source.slice(open, stop))}</span>`;
            index = stop;
            continue;
        }

        if (!/[A-Za-z/]/.test(source[open + 1] ?? "")) {
            html += escapeHtml("<");
            index = open + 1;
            continue;
        }

        const end = endOfTag(source, open);
        const stop = end === -1 ? source.length : end + 1;

        html += paintTag(source.slice(open, stop));
        index = stop;
    }

    return html;
}

export function highlight(code: string, lang: Lang = "ts"): string {
    if (lang === "vue") {
        return paintVue(code);
    }

    return paint(code, lang === "json" ? json : ts);
}