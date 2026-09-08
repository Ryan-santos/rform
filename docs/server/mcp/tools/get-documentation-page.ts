/** Uma página inteira, markdown cru e frontmatter — o que o site renderiza. */
import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { createError } from "h3";
import { z } from "zod";

import { mcpPage, mcpPages } from "../../utils/mcpData";

export default defineMcpTool({
    description:
        "Read one documentation page in full, as raw markdown with its frontmatter. Paths come from list-documentation or search-documentation and carry no locale prefix — the page on the site is https://<docs>/en<path>.",

    inputSchema: {
        path: z
            .string()
            .describe('Page path, e.g. "/fields/text" or "/concepts/presets". "/" is the home.')
    },

    inputExamples: [{ path: "/fields/text" }, { path: "/concepts/presets" }],

    handler: ({ path }) => {
        const page = mcpPage(path);

        if (!page) {
            throw createError({
                statusCode: 404,
                message: `No documentation page at "${path}". Known paths: ${mcpPages()
                    .map((known) => known.path)
                    .join(", ")}`
            });
        }

        return page;
    }
});