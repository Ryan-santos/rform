/**
 * O fonte de um demo é o que o site mostra, byte a byte: o mesmo `demoSourceOf`
 * roda no gerador e no `<DemoCode>`.
 */
import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { createError } from "h3";
import { z } from "zod";

import { mcpDemo, mcpDemos } from "../../utils/mcpData";

export default defineMcpTool({
    description:
        'The source of a runnable rform example, exactly as the documentation site renders it. Demos are named <Component>/<id>, e.g. "Text/basico". Call with no argument to list every demo name.',

    inputSchema: {
        name: z
            .string()
            .optional()
            .describe('Demo name, e.g. "Text/basico". Omit to list every demo.')
    },

    inputExamples: [{}, { name: "Text/basico" }, { name: "Form/modo-zod" }],

    handler: ({ name }) => {
        if (!name) {
            return { count: mcpDemos().length, demos: mcpDemos().map((demo) => demo.name) };
        }

        const found = mcpDemo(name);

        if (!found) {
            throw createError({
                statusCode: 404,
                message: `No demo named "${name}". Call get-demo with no argument to list them.`
            });
        }

        return found;
    }
});