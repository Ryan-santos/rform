import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    modules: [
        "@nuxtjs/color-mode",
        "@nuxt/icon",
        "@nuxt/fonts",
        "@nuxtjs/i18n",
        "../../src/module"
    ],

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
            title: "RForm",

            htmlAttrs: {
                lang: "pt-BR"
            },

            link: [
                {
                    rel: "icon",
                    type: "image/x-icon",
                    href: "/favicon/favicon.ico"
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "16x16",
                    href: "/favicon/1.png"
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "32x32",
                    href: "/favicon/2.png"
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "192x192",
                    href: "/favicon/3.png"
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "512x512",
                    href: "/favicon/4.png"
                },
                {
                    rel: "apple-touch-icon",
                    type: "image/png",
                    sizes: "180x180",
                    href: "/favicon/apple-icon.png"
                }
            ]
        },

        pageTransition: {
            name: "page",
            mode: "out-in"
        },

        layoutTransition: {
            name: "layout",
            mode: "out-in"
        }
    },

    css: ["~/assets/css/main.css"],

    colorMode: {
        fallback: "dark",
        classSuffix: ""
    },

    compatibilityDate: "latest",

    vite: {
        plugins: [tailwindcss()]
    },

    typescript: {
        strict: true
    }
});