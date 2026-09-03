import { describe, expect, it } from "vitest";
import hookUi from "../../src/runtime/utils/hookUi";

/**
 * The class that `src/runtime/style.css` selects on — the spinner reset, the
 * two autofill tricks, and the placeholder hidden under the browser's autofill
 * preview. The failure mode is always the same and always silent: without the
 * class the field still compiles and renders, it just gets no reset at all.
 */
describe("hookUi", () => {
    it("prepends to the top-most entry", () => {
        expect(hookUi({ container: "flex gap-1", group: { input: "p-2" } }, "RField RText"))
            .toEqual({ container: "RField RText flex gap-1", group: { input: "p-2" } });
    });

    it("prepends to a bare string ui", () => {
        expect(hookUi("ml-1 text-sm", "RUtil RUtilsDescription"))
            .toBe("RUtil RUtilsDescription ml-1 text-sm");
    });

    it("stands alone when there is nothing to prepend to", () => {
        expect(hookUi(undefined, "RField RText")).toBe("RField RText");
        expect(hookUi({ container: "" }, "RField RText")).toEqual({ container: "RField RText" });
    });

    /**
     * The whole reason the class is applied here and not declared among the
     * defaults: `ui` is overridable by contract and `mergerUI` reads `null` as
     * "clear this key", so a hook sitting in the defaults would leave with it.
     */
    it("survives a top-most entry the app cleared", () => {
        expect(hookUi({ container: null, group: "grid" }, "RField RText"))
            .toEqual({ container: "RField RText", group: "grid" });
    });

    /**
     * `RUtilsLoading` opens on a `<Transition>`, whose `ui.transition` is a
     * group of transition names rather than a class list.
     */
    it("skips a nested group to reach the first class list", () => {
        expect(hookUi({ transition: { name: "" }, icon: "m-3" }, "RUtil RUtilsLoading"))
            .toEqual({ transition: { name: "" }, icon: "RUtil RUtilsLoading m-3" });
    });

    it("leaves an all-groups ui alone", () => {
        const ui = { transition: { name: "" } };

        expect(hookUi(ui, "RUtil RUtilsLoading")).toBe(ui);
    });

    it("leaves a component with no hook alone", () => {
        const ui = { container: "flex" };

        expect(hookUi(ui, undefined)).toBe(ui);
    });

    /**
     * The merged `ui` can still be the very object the component declared at
     * module scope — `merger` copies by reference when the key exists in only
     * one source — so writing into it would pollute the defaults for every
     * later instance in the process.
     */
    it("does not touch the object it was given", () => {
        const ui = { container: "flex" };

        hookUi(ui, "RField RText");

        expect(ui).toEqual({ container: "flex" });
    });
});
