import { describe, expect, it } from "vitest";

import { collectPresets, presetName } from "../../src/presets";

describe("presetName", () => {
    it("usa o nome do arquivo quando o preset está na raiz", () => {
        expect(presetName("cpf.ts")).toBe("cpf");
    });

    it("prefixa cada pasta pai em camelCase", () => {
        expect(presetName("br/cpf.ts")).toBe("brCpf");
        expect(presetName("br/fiscal/inscricao.ts")).toBe("brFiscalInscricao");
    });

    it("converte segmento kebab-case e snake_case para camelCase", () => {
        expect(presetName("br/insc-est.ts")).toBe("brInscEst");
        expect(presetName("br/insc_est.ts")).toBe("brInscEst");
    });

    it("mantém intacto um nome que já é camelCase", () => {
        expect(presetName("cpfCnpj.ts")).toBe("cpfCnpj");
        expect(presetName("br/cpfCnpj.ts")).toBe("brCpfCnpj");
    });

    it("normaliza separador de caminho do Windows", () => {
        expect(presetName("br\\cpf.ts")).toBe("brCpf");
    });

    it("tira a extensão só do último segmento", () => {
        expect(presetName("v1.2/cpf.ts")).toBe("v1.2Cpf");
    });
});

describe("collectPresets", () => {
    it("pareia todo arquivo com o nome derivado", () => {
        expect(collectPresets(["cpf.ts", "br/insc-est.ts"])).toEqual([
            { name: "cpf", file: "cpf.ts" },
            { name: "brInscEst", file: "br/insc-est.ts" }
        ]);
    });

    it("ignora arquivo que não é módulo typescript ou javascript", () => {
        expect(collectPresets(["cpf.ts", "notes.md", "types.d.ts", "legacy.js"])).toEqual([
            { name: "cpf", file: "cpf.ts" },
            { name: "legacy", file: "legacy.js" }
        ]);
    });

    it("devolve lista vazia quando não há arquivo", () => {
        expect(collectPresets([])).toEqual([]);
    });

    it("lança nomeando os dois arquivos quando dois caminhos colapsam no mesmo nome", () => {
        expect(() => collectPresets(["br/cpf.ts", "brCpf.ts"])).toThrowError(
            /brCpf.*br\/cpf\.ts.*brCpf\.ts/s
        );
    });
});