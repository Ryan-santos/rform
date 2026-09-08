/**
 * Os presets embutidos. O `available` é o filtro por componente, e o fonte cru vai
 * junto — é ele que mostra a forma dos args nomeados (`{ name: "min", min: 3 }`,
 * nunca `args: [3]`), que é o outro ponto em que um agente chuta.
 */
import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { createError } from "h3";
import { z } from "zod";

import { mcpPreset, mcpPresets } from "../../utils/mcpData";

export default defineMcpTool({
    description:
        'Built-in rform rule and mask presets. Without an argument, lists every preset with its kind and the field types it is available on. With a name, returns the source, which shows the named-argument shape a rule reference takes: { name: "min", min: 3 }, never args: [3]. Some names exist as both a rule and a mask (brCpf) — pass kind to disambiguate.',

    inputSchema: {
        name: z
            .string()
            .optional()
            .describe('Preset name, e.g. "brCpf" or "min". Omit to list every preset.'),
        kind: z
            .enum(["rule", "mask"])
            .optional()
            .describe("Narrow the listing, or disambiguate a name that exists as both.")
    },

    inputExamples: [{}, { kind: "mask" }, { name: "min" }, { name: "brCpf", kind: "rule" }],

    handler: ({ name, kind }) => {
        if (!name) {
            const presets = mcpPresets()
                .filter((preset) => !kind || preset.kind === kind)
                .map(({ source: _source, ...preset }) => preset);

            return { count: presets.length, presets };
        }

        const found = mcpPreset(name, kind);

        if (found.length === 0) {
            throw createError({
                statusCode: 404,
                message: `No preset named "${name}"${kind ? ` of kind "${kind}"` : ""}. Call list-presets with no argument to list them.`
            });
        }

        return { count: found.length, presets: found };
    }
});