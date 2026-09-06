import { defineCollection, defineContentConfig, z } from "@nuxt/content";

/**
 * Uma collection por idioma, com `prefix: ""` — o caminho da página é o mesmo
 * nos dois (`/fields/text`), e quem escolhe a árvore é o `locale` em runtime.
 * É o padrão que a doc do Content v3 recomenda para i18n.
 */
const schema = z.object({
    tag: z.string().optional(),
    description: z.string().optional()
});

export default defineContentConfig({
    collections: {
        content_pt: defineCollection({
            type: "page",
            source: { include: "pt/**", prefix: "" },
            schema
        }),
        content_en: defineCollection({
            type: "page",
            source: { include: "en/**", prefix: "" },
            schema
        })
    }
});