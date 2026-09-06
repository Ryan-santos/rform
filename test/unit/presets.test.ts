import { describe, expect, it } from "vitest";

import { collectPresets, presetName } from "../../src/presets";

describe("presetName", () => {
    it("uses the file basename when the preset sits at the root", () => {
        expect(presetName("cpf.ts")).toBe("cpf");
    });

    it("prefixes each parent folder in camelCase", () => {
        expect(presetName("br/cpf.ts")).toBe("brCpf");
        expect(presetName("br/fiscal/inscricao.ts")).toBe("brFiscalInscricao");
    });

    it("camelCases kebab-case and snake_case segments", () => {
        expect(presetName("br/insc-est.ts")).toBe("brInscEst");
        expect(presetName("br/insc_est.ts")).toBe("brInscEst");
    });

    it("keeps an already camelCased basename intact", () => {
        expect(presetName("cpfCnpj.ts")).toBe("cpfCnpj");
        expect(presetName("br/cpfCnpj.ts")).toBe("brCpfCnpj");
    });

    it("normalises windows path separators", () => {
        expect(presetName("br\\cpf.ts")).toBe("brCpf");
    });

    it("strips the extension only from the final segment", () => {
        expect(presetName("v1.2/cpf.ts")).toBe("v1.2Cpf");
    });
});

describe("collectPresets", () => {
    it("pairs every file with its derived name", () => {
        expect(collectPresets(["cpf.ts", "br/insc-est.ts"])).toEqual([
            { name: "cpf", file: "cpf.ts" },
            { name: "brInscEst", file: "br/insc-est.ts" }
        ]);
    });

    it("ignores files that are not typescript or javascript modules", () => {
        expect(collectPresets(["cpf.ts", "notes.md", "types.d.ts", "legacy.js"])).toEqual([
            { name: "cpf", file: "cpf.ts" },
            { name: "legacy", file: "legacy.js" }
        ]);
    });

    it("returns an empty list when there are no files", () => {
        expect(collectPresets([])).toEqual([]);
    });

    it("throws naming both files when two paths collapse to the same name", () => {
        expect(() => collectPresets(["br/cpf.ts", "brCpf.ts"])).toThrowError(
            /brCpf.*br\/cpf\.ts.*brCpf\.ts/s
        );
    });
});