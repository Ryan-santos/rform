/**
 * As duas collections são espelho uma da outra (`content/pt/**` e `content/en/**`),
 * com os mesmos slugs — trocar de idioma é trocar de collection, não de caminho.
 */
export type DocsCollection = "content_pt" | "content_en";

/** `"en"` → `content_en`; qualquer outro locale cai no pack de referência. */
export const collectionOf = (locale: string): DocsCollection =>
    locale === "en" ? "content_en" : "content_pt";