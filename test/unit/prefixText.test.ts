import { describe, expect, it } from "vitest";

import prefixText from "../../src/runtime/utils/prefixText";

describe("prefixText", () => {
    it("prefixes every leaf of text and keeps the tree nested", () => {
        expect(
            prefixText(
                { ui: { container: "flex" }, default: [], text: { button: "add" } },
                "Array",
                "fields"
            )
        ).toEqual({
            ui: { container: "flex" },
            default: [],
            text: { button: "rform.fields.array.add" }
        });
    });

    it("puts the scope in the prefix, so a field and a util of one name do not clash", () => {
        expect(prefixText({ ui: {}, text: { start: "start" } }, "Calendar", "utils")).toEqual({
            ui: {},
            text: { start: "rform.utils.calendar.start" }
        });
    });

    it("prefixes a nested group at every depth", () => {
        expect(
            prefixText(
                {
                    ui: {},
                    text: {
                        zero: "zero",
                        bytes: { b: "b", kb: "kb" }
                    }
                },
                "File",
                "fields"
            )
        ).toEqual({
            ui: {},
            text: {
                zero: "rform.fields.file.zero",
                bytes: {
                    b: "rform.fields.file.bytes.b",
                    kb: "rform.fields.file.bytes.kb"
                }
            }
        });
    });

    it("keeps the whole dotted path of the value", () => {
        expect(
            prefixText({ ui: {}, text: { falback: "test.falback" } }, "Array", "fields")
        ).toEqual({ ui: {}, text: { falback: "rform.fields.array.test.falback" } });
    });

    it("prefixes label and placeholder, which live outside text by contract", () => {
        expect(
            prefixText({ ui: {}, label: "label", placeholder: "placeholder" }, "File", "fields")
        ).toEqual({
            ui: {},
            label: "rform.fields.file.label",
            placeholder: "rform.fields.file.placeholder"
        });
    });

    it("leaves an empty string alone — it is the `nothing to render` sentinel", () => {
        expect(prefixText({ ui: {}, label: "", placeholder: "" }, "Text", "fields")).toEqual({
            ui: {},
            label: "",
            placeholder: ""
        });
    });

    it("does not touch a string that lives outside text", () => {
        expect(
            prefixText({ ui: {}, keyValue: "id", keyLabel: "name" }, "Select", "fields")
        ).toEqual({ ui: {}, keyValue: "id", keyLabel: "name" });
    });

    it("passes an object with no text through unchanged", () => {
        expect(
            prefixText({ ui: { container: "flex" }, default: 0, max: 5 }, "Rating", "fields")
        ).toEqual({ ui: { container: "flex" }, default: 0, max: 5 });
    });

    it("does not mutate the object it was handed", () => {
        const defaults = { ui: {}, label: "label", text: { button: "add", bytes: { b: "b" } } };

        prefixText(defaults, "Array", "fields");

        expect(defaults).toEqual({
            ui: {},
            label: "label",
            text: { button: "add", bytes: { b: "b" } }
        });
    });
});