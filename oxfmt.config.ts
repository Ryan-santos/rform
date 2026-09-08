import { defineConfig } from "oxfmt";

export default defineConfig({
    // O tema do shiki é copiado do `.vsix`, não escrito aqui — reformatá-lo só
    // produziria diff a cada atualização. Isto já morou num `.prettierignore`, que
    // o oxfmt lia por default — o arquivo saiu, a regra ficou.
    ignorePatterns: ["docs/app/assets/shiki/*.json"],

    tabWidth: 4,
    singleQuote: false,
    semi: true,
    trailingComma: "none",
    insertFinalNewline: false,
    singleAttributePerLine: true,
    vueIndentScriptAndStyle: true,
    sortImports: true
});