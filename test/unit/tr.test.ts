import { describe, expect, it } from "vitest";

import { tr, trRule } from "../../src/runtime/utils/tr";

/**
 * `#rform/translate` is aliased to the standalone engine in the unit project,
 * which is the route a rule takes with no bridge around — the same property the
 * old `defaultT` carried: callable with no build.
 */
describe("tr", () => {
    it("resolves a module key by its full path", () => {
        expect(tr("rform.presets.rules.required")).toBe("Campo obrigatório.");
    });

    it("hands an app key back untouched without a bridge", () => {
        expect(tr("form.nome")).toBe("form.nome");
    });
});

describe("trRule", () => {
    it("prefixes rform.presets.rules.", () => {
        expect(trRule("required")).toBe("Campo obrigatório.");
    });

    it("takes params through the object form", () => {
        expect(trRule({ key: "min.number", params: { min: 3 } })).toBe("Valor mínimo: 3.");
    });

    it("hands the prefixed key back when the pack misses it", () => {
        expect(trRule("nao.existe")).toBe("rform.presets.rules.nao.existe");
    });
});