import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import useField from "../../src/runtime/composables/useField";
import useUtil from "../../src/runtime/composables/useUtil";
// By path, not `#components`: these live in the fixture, and the module's own
// type-check resolves `#components` against the module's generated types.
import RRating from "../fixtures/basic/rform/fields/Rating.vue";
import RSwitch from "../fixtures/basic/rform/fields/Switch.vue";

// Vite rewrites `new URL(<template literal>, import.meta.url)`, so paths are
// built from the repo root instead.
const root = process.cwd();

const read = (path: string) => readFile(join(root, "test/fixtures/basic/.nuxt", path), "utf8");

/**
 * The fixture ships `rform/fields/Rating.vue` (a field the module does not
 * have), `rform/fields/Switch.vue` (a replacement for one it does) and
 * `rform/utils/Hint.vue` (a util the module does not have).
 */
describe("a field from app/rform/fields", () => {
    it("is registered under the R prefix and renders", async () => {
        const wrapper = await mountSuspended(RRating);

        expect(wrapper.find("[data-testid='rating-1']").exists()).toBe(true);
    });

    it("gets its own defaults, not another component's", async () => {
        const wrapper = await mountSuspended(RRating);

        // `max: 5` comes from the file's own `defineDefaults`.
        expect(wrapper.findAll("[data-testid^='rating-']")).toHaveLength(5);
        expect(wrapper.find("div").classes()).toContain("rating");
    });

    it("takes a prop declared only in that file", async () => {
        const wrapper = await mountSuspended(RRating, {
            props: { max: 3 } as never
        });

        expect(wrapper.findAll("[data-testid^='rating-']")).toHaveLength(3);
    });

    it("drives a model like any built-in field", async () => {
        const wrapper = await mountSuspended(RRating, {
            props: { modelValue: 0 } as never
        });

        await wrapper.find("[data-testid='rating-4']").trigger("click");

        expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBe(4);
    });
});

describe("a util from app/rform/utils", () => {
    it("renders inside the field that includes it, reading the parent's props", async () => {
        const wrapper = await mountSuspended(RRating, {
            props: { hint: "escolha de 1 a 5" } as never
        });

        expect(wrapper.find("[data-testid='hint']").text()).toBe("escolha de 1 a 5");
    });

    it("stays out of the way when the parent passes nothing", async () => {
        const wrapper = await mountSuspended(RRating);

        expect(wrapper.find("[data-testid='hint']").exists()).toBe(false);
    });
});

describe("a file named after a built-in", () => {
    it("replaces it — the R tag resolves to the user's component", async () => {
        const wrapper = await mountSuspended(RSwitch);

        expect(wrapper.find("[data-testid='custom-switch']").exists()).toBe(true);
        // The built-in renders a checkbox; the replacement does not.
        expect(wrapper.find("input").exists()).toBe(false);
    });

    it("can build on the original through #rform/builtin", async () => {
        const wrapper = await mountSuspended(RSwitch);

        // `default: true` is the replacement's; reaching the button at all means
        // the spread of the built-in `defaults` resolved.
        expect(wrapper.find("[data-testid='custom-switch-toggle']").text()).toBe("on");
        expect(wrapper.find("[data-testid='custom-switch']").classes()).toContain("custom-switch");
    });
});

describe("the generated artifacts", () => {
    it("resolve a replaced component to the user's file, only once", async () => {
        const registry = await read("rform/registry.ts");
        const entries = [...registry.matchAll(/^ {4}Switch:/gm)];

        expect(entries).toHaveLength(1);
        expect(registry).toContain("rform/fields/Switch.vue");
        expect(registry).not.toContain("src/runtime/components/fields/Switch.vue");
    });

    it("list the user's components alongside the built-ins", async () => {
        const registry = await read("rform/registry.ts");

        expect(registry).toContain("Rating: () => import");
        expect(registry).toContain("Hint: () => import");
        expect(registry).toContain("Text: () => import");
    });

    it("register the user's components under the R and RUtils prefixes", async () => {
        const components = await read("components.d.ts");

        expect(components).toContain("export const RRating:");
        expect(components).toContain("export const RUtilsHint:");
    });

    it("point the R tag of a replaced component at the user's file", async () => {
        const components = await read("components.d.ts");
        const line = components
            .split("\n")
            .find((entry) => entry.startsWith("export const RSwitch:"));

        expect(line).toContain("rform/fields/Switch.vue");
        expect(line).not.toContain("src/runtime/components");
    });

    it("let RDynamic resolve the new field by its type", async () => {
        const map = await read("rform/components-map.ts");

        expect(map).toContain(`"rating": Rating`);
    });

    it("give the new field and util a Props entry", async () => {
        const components = await read("rform/types/components/index.ts");
        const utils = await read("rform/types/components/utils/index.ts");

        expect(components).toContain("export type Rating =");
        expect(utils).toContain("export type Hint =");
    });

    it("expose the new util as a `ui.Utils` slot on every field", async () => {
        const props = await read("rform/types/components/utils/props.ts");

        expect(props).toContain(`Hint?: Utils["Hint"]["ui"]`);
    });
});

describe("an unresolvable component name", () => {
    it("fails loudly in useField instead of borrowing Text's defaults", async () => {
        await expect(useField({})).rejects.toThrow(/could not resolve a component name/);

        await expect(useField({}, undefined, "Nope" as never)).rejects.toThrow(/got "Nope"/);
    });

    /**
     * Synchronously, not as a rejection: the name is injected at build time, so
     * a missing one is a build fault and there is nothing to await before
     * saying so.
     */
    it("fails loudly in useUtil instead of borrowing Label's defaults", () => {
        expect(() => useUtil()).toThrow(/could not resolve a component name/);

        expect(() => useUtil(undefined, "Nope" as never)).toThrow(/got "Nope"/);
    });
});