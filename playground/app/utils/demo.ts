import type { InjectionKey, Ref } from "vue";

/**
 * The raw text of the page file, handed down by `<DemoPage>`. Each `<Demo>`
 * slices its own snippet out of it, so the code on screen is literally the code
 * that ran — there is no second copy to forget to update.
 */
export const demoSourceKey = Symbol("demo-source") as InjectionKey<Ref<string>>;

/**
 * `<Demo` only: the lookahead is what keeps `<DemoPage` and `<DemoJson` from
 * matching, since both start with the same five characters.
 */
const TAG = /<Demo(?=[\s/>])|<\/Demo\s*>/g;

/**
 * Walks to the `>` that closes an opening tag, skipping the ones that live
 * inside attribute values — `:rule="({ value }) => value"` carries two.
 */
function endOfTag (source: string, from: number): number {
    let quote: string | null = null;

    for (let i = from; i < source.length; i++) {
        const char = source[i];

        if (quote) {
            if (char === quote) {
                quote = null;
            }

            continue;
        }

        if (char === "\"" || char === "'") {
            quote = char;
            continue;
        }

        if (char === ">") {
            return i;
        }
    }

    return -1;
}

function dedent (block: string): string {
    const lines = block.split("\n");

    while (lines.length > 0 && !lines[0]?.trim()) {
        lines.shift();
    }

    while (lines.length > 0 && !lines.at(-1)?.trim()) {
        lines.pop();
    }

    const indent = lines
        .filter(line => line.trim())
        .reduce(
            (min, line) => Math.min(min, line.length - line.trimStart().length),
            Number.POSITIVE_INFINITY
        );

    const strip = Number.isFinite(indent) ? indent : 0;

    return lines.map(line => line.slice(strip)).join("\n");
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Pulls a `// #region <id>` … `// #endregion` block out of the page's script.
 * The markers are the ones the editor already folds on, so they earn their keep
 * even when nobody is reading the rendered page.
 */
export function extractRegion (source: string, id: string): string {
    if (!source) {
        return "";
    }

    const start = new RegExp(`//\\s*#region\\s+${escape(id)}\\s*$`, "m").exec(source);

    if (!start) {
        return "";
    }

    const from = source.indexOf("\n", start.index);

    if (from === -1) {
        return "";
    }

    const rest = source.slice(from + 1);
    const end = /^[^\S\n]*\/\/\s*#endregion\b/m.exec(rest);

    return dedent(end ? rest.slice(0, end.index) : rest);
}

/**
 * Pulls the children of `<Demo id="...">` out of a page's own source. Matching
 * is by depth over the token stream rather than by regex, so a `<Demo>` nested
 * inside another one closes the right tag.
 */
export function extractDemo (source: string, id: string): string {
    if (!source) {
        return "";
    }

    const tokens: { start: number, end: number, open: boolean }[] = [];

    TAG.lastIndex = 0;

    let match: RegExpExecArray | null = TAG.exec(source);

    while (match !== null) {
        tokens.push({
            start: match.index,
            end: match.index + match[0].length,
            open: !match[0].startsWith("</")
        });

        match = TAG.exec(source);
    }

    const selfClosing = (token: { start: number, end: number }) => {
        const tagEnd = endOfTag(source, token.end);
        return tagEnd !== -1 && source[tagEnd - 1] === "/";
    };

    const needle = `id="${id}"`;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (!token?.open) {
            continue;
        }

        const tagEnd = endOfTag(source, token.end);

        if (tagEnd === -1 || !source.slice(token.start, tagEnd).includes(needle)) {
            continue;
        }

        if (source[tagEnd - 1] === "/") {
            return "";
        }

        let depth = 1;

        for (let j = i + 1; j < tokens.length; j++) {
            const next = tokens[j];

            if (!next) {
                break;
            }

            if (next.open) {
                if (!selfClosing(next)) {
                    depth++;
                }

                continue;
            }

            depth--;

            if (depth === 0) {
                return dedent(source.slice(tagEnd + 1, next.start));
            }
        }

        return "";
    }

    return "";
}
