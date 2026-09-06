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
    it("pairs every .vue file with its name", () => {
        expect(collectComponents([builtin("Text.vue", "Select.vue")])).toEqual([
            { name: "Select", file: "Select.vue", root: "/module/components/fields", user: false },
            { name: "Text", file: "Text.vue", root: "/module/components/fields", user: false }
        ]);
    });

    it("ignores anything that is not a component", () => {
        const found = collectComponents([builtin("Text.vue", "helpers.ts", "README.md", "utils")]);

        expect(found.map((component) => component.name)).toEqual(["Text"]);
    });

    it("lets a later root replace an earlier one by name", () => {
        const found = collectComponents([builtin("Text.vue", "Switch.vue"), user("Switch.vue")]);

        expect(found.map((component) => component.name)).toEqual(["Switch", "Text"]);

        // One entry, pointing at the user's file — a replacement, not a duplicate.
        expect(found.find((component) => component.name === "Switch")).toMatchObject({
            root: "/app/rform/fields",
            user: true
        });
    });

    it("keeps the built-in when the user adds a different name", () => {
        const found = collectComponents([builtin("Text.vue"), user("Rating.vue")]);

        expect(found.map((component) => component.name)).toEqual(["Rating", "Text"]);
    });

    it("refuses a user component named after one the module owns", () => {
        for (const name of RESERVED) {
            expect(() => collectComponents([user(`${name}.vue`)])).toThrow(
                new RegExp(`"${name}" is reserved`)
            );
        }
    });

    it("still allows those names in the module's own roots", () => {
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

    it("rejects a name that cannot survive being a key and a FieldType member", () => {
        for (const file of ["my-field.vue", "text.vue", "2Cool.vue", "My_Field.vue"]) {
            expect(() => collectComponents([user(file)])).toThrow(/invalid component name/);
        }
    });

    it("names the offending directory so the error is actionable", () => {
        expect(() => collectComponents([user("my-field.vue")])).toThrow(/\/app\/rform\/fields/);
    });
});