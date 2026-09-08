/**
 * Gera `.nuxt/docs/mcp.json` — o que as ferramentas MCP leem.
 *
 * Nasce em todo `dev`, `build` e `prepare`, então não há passo a lembrar depois de
 * mexer numa página, num demo ou num preset. Ver o CLAUDE.md.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { addTemplate, defineNuxtModule } from "@nuxt/kit";

import { buildMcp } from "./data.ts";

export default defineNuxtModule({
    meta: {
        name: "rform-docs-mcp"
    },

    setup(_options, nuxt) {
        const dir = join(nuxt.options.buildDir, "docs");

        // O diretório é criado aqui, e não só quando o primeiro JSON é escrito: o
        // kit e o nitro decidem se emitem o path `#docs/*` no tsconfig por um
        // `stat` do alvo do alias. Num `.nuxt` frio o `stat` falha, sai só `#docs`,
        // e `#docs/mcp.json` não resolve — no server, que é onde o nitro manda.
        mkdirSync(dir, { recursive: true });

        // Os dois módulos geradores registram `#docs` com o mesmo valor, de
        // propósito: cada um fica autocontido e não há ordem entre eles a manter.
        // O nitro precisa do alias à parte — o `server/` importa daqui também.
        nuxt.options.alias["#docs"] = dir;
        nuxt.options.nitro.alias ??= {};
        nuxt.options.nitro.alias["#docs"] = dir;

        // Template, ao contrário do `api.json`: este gerador só lê arquivo do
        // repositório, então não depende de nenhum outro template já existir.
        addTemplate({
            filename: "docs/mcp.json",
            // O nitro e o Vite leem este arquivo do disco, então ele não pode
            // ficar só na vfs.
            write: true,
            getContents: () => `${JSON.stringify(buildMcp(), null, 4)}\n`
        });
    }
});