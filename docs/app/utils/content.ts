/**
 * As duas collections são espelho uma da outra (`content/pt/**` e `content/en/**`),
 * com os mesmos slugs — trocar de idioma é trocar de collection, não de caminho.
 */
export type DocsCollection = "content_pt" | "content_en";

/** `"en"` → `content_en`; qualquer outro locale cai no pack de referência. */
export const collectionOf = (locale: string): DocsCollection =>
    locale === "en" ? "content_en" : "content_pt";

/** Item da navegação, do jeito que o `queryCollectionNavigation()` devolve. */
export type NavItem = {
    title?: string;
    path: string;
    tag?: string;
    children?: NavItem[];
};

/**
 * A rota chega prefixada pelo locale (`/pt/fields/text`); o caminho do conteúdo,
 * não. É o mesmo corte em todo lugar que compara rota com conteúdo.
 */
export const currentPath = (path: string) => path.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

/**
 * Achata a árvore da navegação nas páginas que de fato existem, na ordem da barra
 * lateral — é dela que saem o anterior e o próximo do rodapé.
 */
export const flattenNav = (items: NavItem[] = []): NavItem[] =>
    items.flatMap((item) => (item.children?.length ? flattenNav(item.children) : [item]));