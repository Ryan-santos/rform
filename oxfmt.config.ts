import { defineConfig } from "oxfmt";

export default defineConfig({
    // Gerados por script (`docs/scripts/api.ts`, o tema do shiki): o formato é do
    // JSON.stringify, e reformatar aqui é vaivém com o próximo `pnpm --filter
    // rform-docs api`. Isto já morou num `.prettierignore`, que o oxfmt lia por
    // default — o arquivo saiu, a regra ficou.
    ignorePatterns: ["docs/app/generated", "docs/app/assets/shiki/*.json"],

    tabWidth: 4,
    singleQuote: false,
    semi: true,
    trailingComma: "none",
    insertFinalNewline: false,
    singleAttributePerLine: true,
    vueIndentScriptAndStyle: true,
    sortImports: true
});