import tailwindcss from "@tailwindcss/vite";

// Sem `@nuxtjs/i18n`: adicionar i18n a um playground de tema transformaria toda
// label em chave, e o assunto aqui é `ui`, token e `defineFieldDefaults`.
export default defineNuxtConfig({
    modules: ["@nuxtjs/color-mode", "@nuxt/icon", "@nuxt/fonts", "../../src/module"],

    app: {
        head: {
            title: "rform · ui",
            htmlAttrs: { lang: "pt-BR" }
        }
    },

    css: ["~/assets/css/main.css"],

    colorMode: {
        fallback: "dark",
        classSuffix: ""
    },

    devServer: {
        port: 3033
    },

    compatibilityDate: "latest",

    vite: {
        plugins: [tailwindcss()]
    },

    typescript: {
        strict: true
    }
});