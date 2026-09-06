import { describe, expect, it } from "vitest";

import { collectComponents, RESERVED } from "../../src/scan";

const builtin = (...files: string[]) => ({
    root: "/module/components/fields",
    files,
    user: false
});

const user = (...files: string[]) => ({
    root: "/app/rform/fields",
    files,
    user: true
});

describe("collectComponents", () => {
    it("pareia todo .vue com o nome dele", () => {
        expect(collectComponents([builtin("Text.vue", "Select.vue")])).toEqual([
            { name: "Select", file: "Select.vue", root: "/module/components/fields", user: false },
            { name: "Text", file: "Text.vue", root: "/module/components/fields", user: false }
        ]);
    });

    it("ignora o que não é componente", () => {
        const found = collectComponents([builtin("Text.vue", "helpers.ts", "README.md", "utils")]);

        expect(found.map((component) => component.name)).toEqual(["Text"]);
    });

    it("deixa uma raiz posterior substituir a anterior pelo nome", () => {
        const found = collectComponents([builtin("Text.vue", "Switch.vue"), user("Switch.vue")]);

        expect(found.map((component) => component.name)).toEqual(["Switch", "Text"]);

        // Uma entrada só, apontando para o arquivo do usuário: substituição, não cópia.
        expect(found.find((component) => component.name === "Switch")).toMatchObject({
            root: "/app/rform/fields",
            user: true
        });
    });

    it("mantém o embutido quando o usuário adiciona outro nome", () => {
        const found = collectComponents([builtin("Text.vue"), user("Rating.vue")]);

        expect(found.map((component) => component.name)).toEqual(["Rating", "Text"]);
    });

    it("recusa componente do usuário com o nome de um que o módulo possui", () => {
        for (const name of RESERVED) {
            expect(() => collectComponents([user(`${name}.vue`)])).toThrow(
                new RegExp(`"${name}" is reserved`)
            );
        }
    });

    it("continua permitindo esses nomes nas raízes do próprio módulo", () => {
        const containers = {
            root: "/module/components",
            files: ["Form.vue", "Dynamic.vue"],
            user: false
        };

        expect(collectComponents([containers]).map((component) => component.name)).toEqual([
            "Dynamic",
            "Form"
        ]);
    });

    it("recusa nome que não sobrevive a ser chave e membro do FieldType", () => {
        for (const file of ["my-field.vue", "text.vue", "2Cool.vue", "My_Field.vue"]) {
            expect(() => collectComponents([user(file)])).toThrow(/invalid component name/);
        }
    });

    it("nomeia o diretório culpado, para o erro ser acionável", () => {
        expect(() => collectComponents([user("my-field.vue")])).toThrow(/\/app\/rform\/fields/);
    });
});