import tailwindcss from "@tailwindcss/vite";

import { shikiTheme } from "./app/assets/shiki";

export default defineNuxtConfig({
    modules: [
        "@nuxt/content",
        "@nuxtjs/color-mode",
        "@nuxt/icon",
        "@nuxt/fonts",
        "@nuxtjs/i18n",
        "@nuxtjs/mcp-toolkit",
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

    mcp: {
        name: "rform-docs",
        route: "/mcp",
        description: "rform documentation — fields, props, demos and presets.",
        instructions: [
            "This server exposes the rform documentation (a Nuxt forms module).",
            "",
            "Call get-component-api BEFORE writing any rform component in a template:",
            "the module's prop types come from intersections and are not readable in",
            "any .d.ts, so guessing them is the most common failure. Two shapes agents",
            "get wrong: `label`, `placeholder`, `description` and `error` are TrInput",
            "(a translation key), not plain string; and a rule reference takes named",
            'arguments — { name: "min", min: 3 }, never args: [3].',
            "",
            "Use search-documentation to find the page, get-documentation-page to read",
            "it, get-demo for working code, and list-presets for the built-in rules and",
            "masks. The documentation served here is English only."
        ].join("\n")
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

    nitro: {
        preset: "cloudflare_module",

        cloudflare: {
            deployConfig: true,

            wrangler: {
                name: "rform"
            }
        },

        prerender: {
            crawlLinks: true,
            routes: ["/pt", "/en"],
            ignore: ["/mcp"]
        }
    },

    compatibilityDate: "latest",

    vite: {
        plugins: [tailwindcss()]
    },

    typescript: {
        strict: true
    }
});