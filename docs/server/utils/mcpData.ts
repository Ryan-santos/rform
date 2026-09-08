import api from "#docs/api.json";
import data from "#docs/mcp.json";

/**
 * O único lugar que conhece o endereço dos dois JSON — as ferramentas MCP leem
 * daqui e ficam só com a forma da resposta.
 *
 * Os dois são artefato de build, escritos em `.nuxt/docs/` pelos módulos de
 * `modules/{api,mcp}`, então nada aqui consulta o `@nuxt/content` em runtime: o
 * worker não precisa de banco.
 */
import type { ComponentMeta } from "../../modules/api/data.ts";
import type { McpDemo, McpPage, McpPreset } from "../../modules/mcp/data.ts";

export type { ComponentMeta, McpDemo, McpPage, McpPreset };

/** O componente, com a tag que se escreve no template — `RText`, `RUtilsLabel`. */
export type ComponentEntry = ComponentMeta & { tag: string };

const tagOf = (component: ComponentMeta) =>
    component.kind === "util" ? `RUtils${component.name}` : `R${component.name}`;

const entries: ComponentEntry[] = (api as ComponentMeta[]).map((component) => ({
    ...component,
    tag: tagOf(component)
}));

const pages = (data as { pages: McpPage[] }).pages;

const demos = (data as { demos: McpDemo[] }).demos;

const presets = (data as { presets: McpPreset[] }).presets;

/** Todas as páginas de `content/en`, na ordem da barra lateral. */
export const mcpPages = (): McpPage[] => pages;

/** Aceita `"/fields/text"` e `"fields/text"`; `""` e `"/"` são a home. */
export const mcpPage = (path: string): McpPage | undefined => {
    const wanted = `/${path.trim().replace(/^\/+|\/+$/g, "")}`;

    return pages.find((page) => page.path === wanted);
};

export const mcpDemos = (): McpDemo[] => demos;

/** Aceita `"Text/basico"`, sem diferença de caixa. */
export const mcpDemo = (name: string): McpDemo | undefined => {
    const wanted = name.trim().toLowerCase();

    return demos.find((demo) => demo.name.toLowerCase() === wanted);
};

export const mcpPresets = (): McpPreset[] => presets;

/** Um preset pelo nome; com `kind`, desempata o `brCpf` que existe nos dois. */
export const mcpPreset = (name: string, kind?: McpPreset["kind"]): McpPreset[] => {
    const wanted = name.trim().toLowerCase();

    return presets.filter(
        (preset) => preset.name.toLowerCase() === wanted && (!kind || preset.kind === kind)
    );
};

export const mcpComponents = (): ComponentEntry[] => entries;

/**
 * Aceita a tag (`RText`, `RUtilsLabel`) ou o nome do arquivo (`Text`). `Calendar`
 * é campo **e** util, então o nome pelado prefere o campo — quem quer o outro
 * escreve `RUtilsCalendar`.
 */
export const mcpComponent = (component: string): ComponentEntry | undefined => {
    const wanted = component.trim().toLowerCase();

    return (
        entries.find((entry) => entry.tag.toLowerCase() === wanted) ??
        entries.find((entry) => entry.name.toLowerCase() === wanted && entry.kind !== "util") ??
        entries.find((entry) => entry.name.toLowerCase() === wanted)
    );
};