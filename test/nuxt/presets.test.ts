// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { defineMask, defineRule } from "#rform/utils";

// Vite rewrites `new URL(<template literal>, import.meta.url)`, so paths are
// built from the repo root instead.
const root = process.cwd();

const read = (path: string) => readFile(join(root, "test/fixtures/basic/.nuxt", path), "utf8");

describe("preset helpers", () => {
    it("are named exports of #rform/utils", () => {
        expect(defineRule).toBeTypeOf("function");
        expect(defineMask).toBeTypeOf("function");
    });

    it("hand the preset object back untouched", () => {
        const rule = { available: ["text"], validation: () => undefined } as const;
        const mask = { mask: "###" } as const;

        expect(defineRule(rule)).toBe(rule);
        expect(defineMask(mask)).toBe(mask);
    });

    it("are imported, never auto-imported", async () => {
        const imports = await read("imports.d.ts");

        expect(imports).not.toContain("definePreset");
    });
});

describe("#rform/utils barrel", () => {
    it("re-exports every util's named exports, not just its default", async () => {
        const utils = await read("rform/utils.ts");
        const files = (await readdir(join(root, "src/runtime/utils")))
            .filter(file => file.endsWith(".ts"));

        for (const file of files) {
            expect(utils).toContain(`export * from "`);
            expect(utils).toContain(file);
        }
    });
});

describe("br namespace", () => {
    it("prefixes every brazilian preset, rules and masks alike", async () => {
        const presets = await read("rform/presets.ts");

        for (const name of ["brCpf", "brCnpj", "brCep", "brTelefone"]) {
            expect(presets).toContain(`"${name}"`);
        }

        for (const name of ["brCelular", "brCpfCnpj", "brPlaca", "brData"]) {
            expect(presets).toContain(`"${name}"`);
        }
    });

    it("leaves no unprefixed brazilian preset behind", async () => {
        const presets = await read("rform/presets.ts");

        for (const name of ["cpf", "cnpj", "cep", "telefone", "celular", "placa"]) {
            expect(presets).not.toContain(`"${name}":`);
        }
    });

    it("keeps the generic rules unprefixed", async () => {
        const presets = await read("rform/presets.ts");

        for (const name of ["required", "min", "max", "email", "url"]) {
            expect(presets).toContain(`"${name}"`);
        }
    });
});

describe("FieldType", () => {
    it("lists one member per field component", async () => {
        const contents = await read("rform/types/fields.d.ts");
        const generated = [...contents.matchAll(/"([^"]+)"/g)]
            .map(match => match[1] ?? "")
            .sort((a, b) => a.localeCompare(b));

        const expected = (await readdir(join(root, "src/runtime/components")))
            .filter(file => file.endsWith(".vue"))
            .map(file => file.slice(0, -4))
            .filter(name => !["Form", "Dynamic"].includes(name))
            .map(name => name.toLowerCase())
            .sort((a, b) => a.localeCompare(b));

        expect(generated).toEqual(expected);
    });

    it("covers the field types the masked components pass to Element", async () => {
        const contents = await read("rform/types/fields.d.ts");

        expect(contents).toContain(`"text"`);
        expect(contents).toContain(`"textarea"`);
        expect(contents).toContain(`"date"`);
        expect(contents).toContain(`"hour"`);
    });
});
