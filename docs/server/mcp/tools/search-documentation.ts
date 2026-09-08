/**
 * Busca em granularidade de **página**: sobre o JSON, fatiar por âncora exigiria
 * replicar a slugificação de heading do `@nuxt/content` — o
 * `queryCollectionSearchSections` daria seção por seção, e o preço dele é um D1 (ver
 * o CLAUDE.md). O `headings` de cada hit diz o que tem lá dentro.
 */
import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

import { searchDocs, type Section } from "../../../app/utils/search";
import { mcpPages } from "../../utils/mcpData";

/**
 * Os `titles` levam a trilha do caminho **e** os títulos internos da página. É o
 * que compensa a granularidade de página: sem eles toda página que cita as duas
 * palavras empata no corpo (peso 1) e o desempate vira a ordem da barra lateral —
 * `"mask cpf"` respondia com a home antes de `/concepts/presets`. Nada disso é
 * exibido; só pesa no score, onde um título de seção vale o que vale no site.
 */
const sections = (): Section[] =>
    mcpPages().map((page) => ({
        id: page.path,
        title: page.title,
        titles: [...page.path.split("/").filter(Boolean).slice(0, -1), ...page.headings],
        level: 1,
        content: page.markdown
    }));

export default defineMcpTool({
    description:
        "Full-text search across the rform documentation. Every word of the query must appear somewhere in a page; hits are ranked by where it appeared (title over trail over body). Returns the page path, title, a snippet and the page's headings — call get-documentation-page with the path for the full text.",

    inputSchema: {
        query: z.string().describe('What to look for, e.g. "cpf mask" or "aggregate rules".'),
        limit: z.number().int().min(1).max(50).optional().describe("Max hits (default 12).")
    },

    inputExamples: [{ query: "cpf mask" }, { query: "focus first error", limit: 5 }],

    handler: ({ query, limit }) => {
        const pages = new Map(mcpPages().map((page) => [page.path, page]));

        const hits = searchDocs(sections(), query, limit ?? 12).map((hit) => ({
            path: hit.id,
            title: hit.title,
            description: pages.get(hit.id)?.description,
            tag: pages.get(hit.id)?.tag,
            headings: pages.get(hit.id)?.headings ?? [],
            snippet: hit.snippet
        }));

        return { query, count: hits.length, hits };
    }
});