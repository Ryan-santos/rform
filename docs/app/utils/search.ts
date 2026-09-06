/**
 * A busca do site, sobre as seções que o `queryCollectionSearchSections()` devolve
 * — o texto das páginas, e não os títulos da barra lateral.
 */
export type Section = {
    /** Caminho da seção, com âncora quando é um subtítulo — `/fields/text#label`. */
    id: string;
    title: string;
    /** Os títulos acima desta seção, do título da página até o pai dela. */
    titles: string[];
    level: number;
    content: string;
};

export type Hit = Section & { snippet: string };

const FOLD = "áàâãäéèêëíìîïóòôõöúùûüçñ";

const PLAIN = "aaaaaeeeeiiiiooooouuuucn";

/**
 * Minúsculas sem acento, **um caractere por caractere** — o `NFD` habitual muda o
 * comprimento da string, e aí o índice do trecho não serve mais para recortar o
 * texto original.
 */
const fold = (value: string) =>
    value.toLowerCase().replaceAll(/[^ -~]/g, (char) => {
        const index = FOLD.indexOf(char);

        return index < 0 ? char : PLAIN[index]!;
    });

/** O trecho em volta da primeira ocorrência, com reticências quando cortou. */
const snippetOf = (content: string, word: string, around = 70) => {
    const at = fold(content).indexOf(word);

    if (at < 0) {
        return content.slice(0, around * 2).trim();
    }

    const start = Math.max(0, at - around);
    const end = Math.min(content.length, at + word.length + around);

    return `${start > 0 ? "…" : ""}${content.slice(start, end).trim()}${end < content.length ? "…" : ""}`;
};

/**
 * Toda palavra do termo tem de aparecer em algum lugar da seção; o que ordena é
 * onde ela apareceu — título vale mais que trilha, que vale mais que corpo.
 *
 * @example searchDocs(sections, "mask cpf") // → [{ id: "/concepts/presets#masks", … }]
 */
export const searchDocs = (sections: Section[], term: string, limit = 12): Hit[] => {
    const words = fold(term).split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return [];
    }

    const hits: (Hit & { score: number })[] = [];

    for (const section of sections) {
        const title = fold(section.title ?? "");
        const trail = fold((section.titles ?? []).join(" "));
        const content = fold(section.content ?? "");

        let score = 0;

        const every = words.every((word) => {
            const found =
                (title.includes(word) ? 10 : 0) +
                (title.startsWith(word) ? 5 : 0) +
                (trail.includes(word) ? 3 : 0) +
                (content.includes(word) ? 1 : 0);

            score += found;

            return found > 0;
        });

        if (every) {
            hits.push({ ...section, snippet: snippetOf(section.content ?? "", words[0]!), score });
        }
    }

    return hits
        .sort((a, b) => b.score - a.score || a.level - b.level)
        .slice(0, limit)
        .map(({ score: _score, ...hit }) => hit);
};