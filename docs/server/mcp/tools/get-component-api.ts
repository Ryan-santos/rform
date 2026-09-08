/**
 * A tabela de props gerada pelo `vue-component-meta`, que é a razão de o MCP
 * existir: os tipos do módulo saem de interseção (`Element<…> & Utils[…] &
 * TextProp<…>`) e não estão legíveis em nenhum `.d.ts` — um agente que não
 * consulta aqui chuta a forma dos props.
 */
import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { createError } from "h3";
import { z } from "zod";

import { mcpComponent, mcpComponents } from "../../utils/mcpData";

export default defineMcpTool({
    description:
        "Props, slots and events of an rform component, generated from the source by vue-component-meta — the authoritative shape, since the module's prop types come from intersections and are not readable in any .d.ts. Call with no argument to list every component. Note that `label`, `placeholder`, `description` and `error` are TrInput (a translation key), not plain string.",

    inputSchema: {
        component: z
            .string()
            .optional()
            .describe(
                'Tag ("RText", "RUtilsLabel") or file name ("Text"). Omit to list every component.'
            )
    },

    inputExamples: [{}, { component: "RText" }, { component: "Select" }],

    handler: ({ component }) => {
        if (!component) {
            return {
                count: mcpComponents().length,
                components: mcpComponents().map((entry) => ({
                    tag: entry.tag,
                    name: entry.name,
                    kind: entry.kind,
                    props: entry.props.length
                }))
            };
        }

        const found = mcpComponent(component);

        if (!found) {
            throw createError({
                statusCode: 404,
                message: `No component "${component}". Known tags: ${mcpComponents()
                    .map((entry) => entry.tag)
                    .join(", ")}`
            });
        }

        return found;
    }
});