import { collectionOf } from "~/utils/content";

/**
 * A navegação do site, buscada num lugar só: a barra lateral, o rodapé de páginas
 * e o nome da seção leem daqui.
 *
 * Um `useAsyncData` por arquivo dava três handlers para a mesma chave — e o Nuxt
 * compara os handlers pelo fonte, então avisava a cada render.
 */
export const useDocsNav = () => {
    const { locale } = useI18n();

    return useAsyncData(
        () => `nav-${locale.value}`,
        () => queryCollectionNavigation(collectionOf(locale.value), ["tag"]),
        { watch: [locale] }
    );
};