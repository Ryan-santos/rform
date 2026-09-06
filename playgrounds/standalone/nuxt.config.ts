import tailwindcss from "@tailwindcss/vite";

// Sem `@nuxtjs/i18n` de propósito: é este playground que exercita o motor de
// tradução próprio do módulo (`runtime/translate/standalone.ts`).
export default defineNuxtConfig({
    modules: ["@nuxtjs/color-mode", "@nuxt/icon", "@nuxt/fonts", "../../src/module"],

    rform: {
        locale: "pt-BR"
    },

    app: {
        head: {
            title: "rform · standalone",
            htmlAttrs: { lang: "pt-BR" }
        }
    },

    css: ["~/assets/css/main.css"],

    colorMode: {
        fallback: "dark",
        classSuffix: ""
    },

    devServer: {
        port: 3032
    },

    compatibilityDate: "latest",

    vite: {
        plugins: [tailwindcss()]
    },

    typescript: {
        strict: true
    }
});