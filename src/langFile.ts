/**
 * O arquivo de locale que a ponte registra no `langDir` — o pack do módulo sob a
 * chave `rform`.
 *
 * **Loader com `import()`, nunca um objeto literal com `import` estático**, e as
 * duas metades são obrigatórias:
 *
 * - o `@nuxtjs/i18n` pré-compila **todo** arquivo de locale pelo gerador do
 *   intlify, que só sabe lidar com literal estático. Diante de um
 *   `export default { rform: locales["pt-BR"] ?? {} }` ele emite código inválido
 *   (`"rform": rform{`) e o build morre apontando para um arquivo cujo conteúdo em
 *   disco está correto. Função no `export default` é o que o `scanAst` dele deixa
 *   passar intacto;
 * - o mesmo handler faz `i18nPathSet.add` de todo **import estático** do arquivo,
 *   então um `import { locales } from "#rform/locales"` arrastaria o barrel de
 *   packs para o conjunto a pré-compilar — e aquele arquivo é ainda menos literal.
 *   `import()` dinâmico não entra no `findStaticImports`.
 *
 * @example langFile("rform", "pt-BR") // → "export default async () => { … }"
 */
export const langFile = (name: string, code: string) =>
    [
        "// gerado — o pack deste locale, no namespace `rform`",
        "// Loader, e o import é dinâmico: ver o JSDoc de `langFile` em `src/langFile.ts`.",
        "export default async () => {",
        `    const { locales } = await import("#${name}/locales");`,
        "",
        `    return { ${name}: locales[${JSON.stringify(code)}] ?? {} };`,
        "};"
    ].join("\n");