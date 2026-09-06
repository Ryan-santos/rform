import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { defineMask, defineRule } from "#rform/utils";

// O Vite reescreve `new URL(<template literal>, import.meta.url)`, então os
// caminhos são montados a partir da raiz do repo.
const root = process.cwd();

const read = (path: string) => readFile(join(root, "test/fixtures/basic/.nuxt", path), "utf8");

describe("helpers de preset", () => {
    it("são exports nomeados de #rform/utils", () => {
        expect(defineRule).toBeTypeOf("function");
        expect(defineMask).toBeTypeOf("function");
    });

    it("devolvem o objeto do preset intacto", () => {
        const rule = { available: ["text"], validation: () => undefined } as const;
        const mask = { mask: "###" } as const;

        expect(defineRule(rule)).toBe(rule);
        expect(defineMask(mask)).toBe(mask);
    });

    it("são importados, nunca auto-importados", async () => {
        const imports = await read("imports.d.ts");

        expect(imports).not.toContain("definePreset");
    });
});

describe("barrel #rform/utils", () => {
    it("reexporta os exports nomeados de cada util, não só o default", async () => {
        const utils = await read("rform/utils.ts");
        const files = (await readdir(join(root, "src/runtime/utils"))).filter((file) =>
            file.endsWith(".ts")
        );

        for (const file of files) {
            expect(utils).toContain(`export * from "`);
            expect(utils).toContain(file);
        }
    });
});

describe("namespace br", () => {
    it("prefixa todo preset brasileiro, rules e masks igualmente", async () => {
        const presets = await read("rform/presets.ts");

        for (const name of ["brCpf", "brCnpj", "brCep", "brTelefone"]) {
            expect(presets).toContain(`"${name}"`);
        }

        for (const name of ["brCelular", "brCpfCnpj", "brPlaca", "brData"]) {
            expect(presets).toContain(`"${name}"`);
        }
    });

    it("não deixa preset brasileiro sem prefixo para trás", async () => {
        const presets = await read("rform/presets.ts");

        for (const name of ["cpf", "cnpj", "cep", "telefone", "celular", "placa"]) {
            expect(presets).not.toContain(`"${name}":`);
        }
    });

    it("mantém as rules genéricas sem prefixo", async () => {
        const presets = await read("rform/presets.ts");

        for (const name of ["required", "min", "max", "email", "url"]) {
            expect(presets).toContain(`"${name}"`);
        }
    });
});

describe("FieldType", () => {
    it("lista um membro por componente de campo, nas duas raízes", async () => {
        const contents = await read("rform/types/fields.d.ts");
        const generated = [...contents.matchAll(/"([^"]+)"/g)]
            .map((match) => match[1] ?? "")
            .sort((a, b) => a.localeCompare(b));

        const roots = [
            join(root, "src/runtime/components/fields"),
            join(root, "test/fixtures/basic/rform/fields")
        ];

        // Um set: a fixture substitui `Switch`, que é um membro, não dois.
        const expected = [
            ...new Set(
                (await Promise.all(roots.map((dir) => readdir(dir))))
                    .flat()
                    .filter((file) => file.endsWith(".vue"))
                    .map((file) => file.slice(0, -4).toLowerCase())
            )
        ].sort((a, b) => a.localeCompare(b));

        expect(generated).toEqual(expected);
    });

    it("deixa de fora Form e Dynamic, que moram fora de `fields`", async () => {
        const contents = await read("rform/types/fields.d.ts");

        expect(contents).not.toContain(`"form"`);
        expect(contents).not.toContain(`"dynamic"`);
    });

    it("cobre os field types que os componentes com máscara passam ao Element", async () => {
        const contents = await read("rform/types/fields.d.ts");

        expect(contents).toContain(`"text"`);
        expect(contents).toContain(`"textarea"`);
        expect(contents).toContain(`"date"`);
        expect(contents).toContain(`"hour"`);
    });
});