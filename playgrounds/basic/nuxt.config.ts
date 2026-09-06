import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    modules: ["@nuxtjs/color-mode", "@nuxt/icon", "@nuxt/fonts", "@nuxtjs/i18n", "../../src/module"],

    i18n: {
        strategy: "no_prefix",
        defaultLocale: "pt-BR",
        langDir: "locales",
        locales: [
            { code: "pt-BR", name: "Português", file: "pt-BR.json" },
            { code: "en", name: "English", file: "en.json" }
        ]
    },

    app: {
        head: {
            title: "rform · basic",
            htmlAttrs: { lang: "pt-BR" }
        }
    },

    css: ["~/assets/css/main.css"],

    colorMode: {
        fallback: "dark",
        classSuffix: ""
    },

    devServer: {
        port: 3031
    },

    compatibilityDate: "latest",

    vite: {
        plugins: [tailwindcss()]
    },

    typescript: {
        strict: true
    }
});