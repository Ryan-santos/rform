import tailwindcss from "@tailwindcss/vite";

import { shikiTheme } from "./app/assets/shiki";

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

    // O mesmo tema do `DemoCode`, para o bloco da prosa e o do demo terem a
    // mesma cara. As duas chaves apontam para ele de propósito: o `defu` do
    // @nuxt/content mescla com o default do mdc, e um `dark` sobrevivente traria
    // o github-dark de volta em metade dos tokens.
    content: {
        build: {
            markdown: {
                toc: {
                    depth: 3
                },

                highlight: {
                    theme: {
                        default: shikiTheme,
                        dark: shikiTheme
                    }
                }
            }
        }
    },

    app: {
        head: {
            title: "RForm",

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