import { generateJavaScript } from "@intlify/bundle-utils";
import { describe, expect, it } from "vitest";

import { langFile } from "../../src/langFile";

const file = langFile("rform", "pt-BR");

/**
 * O que o `@nuxtjs/i18n` faz com todo arquivo de locale: o gerador do intlify,
 * com `allowDynamic` — os mesmos argumentos que o `VueI18nPlugin` recebe lá.
 */
const precompile = (source: string) =>
    generateJavaScript(source, {
        filename: "pt-BR.ts",
        allowDynamic: true,
        env: "production"
    }).code;

describe("langFile", () => {
    it("entrega o pack do locale sob a chave do módulo", () => {
        expect(file).toContain('return { rform: locales["pt-BR"] ?? {} };');
    });

    it("sobrevive intacto ao pré-compilador de mensagens do intlify", () => {
        // O bug do 0.1.0: um `export default {}` de valores não literais saía como
        // `"rform": rform{`, e o build morria apontando para um arquivo cujo
        // conteúdo em disco estava correto.
        expect(precompile(file)).toBe(file);
    });

    it("não tem import estático, que o i18n arrastaria para o mesmo transform", () => {
        expect(file).not.toMatch(/^\s*import\s+[^(]/m);
        expect(file).toContain('await import("#rform/locales")');
    });

    it("prova que a forma antiga era o que quebrava", () => {
        const literal = [
            'import { locales } from "#rform/locales";',
            "",
            'export default { rform: locales["pt-BR"] ?? {} };'
        ].join("\n");

        // O token que o build reportou como `Expected "}" but found "{"`.
        expect(precompile(literal)).toContain("rform{");
    });
});