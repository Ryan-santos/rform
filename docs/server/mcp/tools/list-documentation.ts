/** O índice inteiro — 28 páginas, então cabe numa resposta só e dispensa paginação. */
import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";

import { mcpPages } from "../../utils/mcpData";

export default defineMcpTool({
    description:
        "List every rform documentation page: path, title, description, the component tag it documents (when it documents one) and its headings. Start here to see what exists, then call get-documentation-page.",

    handler: () => {
        const pages = mcpPages().map((page) => ({
            path: page.path,
            title: page.title,
            description: page.description,
            tag: page.tag,
            headings: page.headings
        }));

        return { count: pages.length, pages };
    }
});