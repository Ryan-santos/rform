import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    modules: [
        "@nuxt/content",
        "@nuxtjs/color-mode",
        "@nuxt/icon",
        "@nuxt/fonts",
        "@nuxtjs/i18n",
        "../src/module"
    ],

    // `pt`, e não `pt-BR`: o `packFor` do módulo escolhe o pack por code exato e,
    // na falta, por língua — então `pt` recebe o pack `pt-BR` sem inventar code
    // nenhum na lista de locales do site.
    i18n: {
        strategy: "prefix",
        defaultLocale: "pt",
        langDir: "locales",
        locales: [
            { code: "pt", name: "Português", language: "pt-BR", file: "pt.json" },
            { code: "en", name: "English", language: "en-US", file: "en.json" }
        ]
    },

    content: {
        build: {
            markdown: {
                toc: {
                    depth: 3
                }
            }
        }
    },

    app: {
        head: {
            title: "rform",

            htmlAttrs: {
                lang: "pt-BR"
            },

            link: [
                {
                    rel: "icon",
                    type: "image/x-icon",
                    href: "/favicon/favicon.ico"
                }
            ]
        }
    },

    css: ["~/assets/css/main.css"],

    colorMode: {
        fallback: "dark",
        classSuffix: ""
    },

    devServer: {
        port: 3000
    },

    compatibilityDate: "latest",

    vite: {
        plugins: [tailwindcss()]
    },

    typescript: {
        strict: true
    }
});