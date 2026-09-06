import { describe, expect, it } from "vitest";

import { tr, trRule } from "../../src/runtime/utils/tr";

// No projeto unit, `#rform/translate` é aliasado para o motor sem ponte — a rota
// que uma rule toma sem ponte em volta, e o que a torna chamável sem build.
describe("tr", () => {
    it("resolve uma chave do módulo pelo caminho completo", () => {
        expect(tr("rform.presets.rules.required")).toBe("Campo obrigatório.");
    });

    it("devolve intacta uma chave do app quando não há ponte", () => {
        expect(tr("form.nome")).toBe("form.nome");
    });
});

describe("trRule", () => {
    it("prefixa rform.presets.rules.", () => {
        expect(trRule("required")).toBe("Campo obrigatório.");
    });

    it("aceita params pela forma de objeto", () => {
        expect(trRule({ key: "min.number", params: { min: 3 } })).toBe("Valor mínimo: 3.");
    });

    it("devolve a chave prefixada quando o pack não a tem", () => {
        expect(trRule("nao.existe")).toBe("rform.presets.rules.nao.existe");
    });
});