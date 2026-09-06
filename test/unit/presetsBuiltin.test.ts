import { describe, expect, it } from "vitest";

import maskCep from "../../src/runtime/presets/masks/br/cep";
import maskCpf from "../../src/runtime/presets/masks/br/cpf";
import maskCpfCnpj from "../../src/runtime/presets/masks/br/cpfCnpj";
import cep from "../../src/runtime/presets/rules/br/cep";
import cnpj from "../../src/runtime/presets/rules/br/cnpj";
import cpf from "../../src/runtime/presets/rules/br/cpf";
import telefone from "../../src/runtime/presets/rules/br/telefone";
import email from "../../src/runtime/presets/rules/email";
import max from "../../src/runtime/presets/rules/max";
import min from "../../src/runtime/presets/rules/min";
import required from "../../src/runtime/presets/rules/required";
import url from "../../src/runtime/presets/rules/url";

/**
 * The context is `{ value, form }` and nothing else — a preset reaches the
 * active locale through the imported `trRule`, not through the channel every
 * validation reads from. This calls `validation` straight, with no build
 * around, which is the route `#rform/translate` has to keep working.
 */
const run = (
    preset: { validation: (context: never) => unknown },
    value: unknown,
    args: Record<string, unknown> = {}
) => (preset.validation as (c: Record<string, unknown>) => unknown)({ ...args, value, form: {} });

describe("required", () => {
    it("rejects empty values", () => {
        expect(run(required, undefined)).toBeTypeOf("string");
        expect(run(required, null)).toBeTypeOf("string");
        expect(run(required, "")).toBeTypeOf("string");
        expect(run(required, "   ")).toBeTypeOf("string");
        expect(run(required, [])).toBeTypeOf("string");
        expect(run(required, false)).toBeTypeOf("string");
    });

    it("accepts zero as a real value", () => {
        expect(run(required, 0)).toBeUndefined();
    });

    it("accepts filled values", () => {
        expect(run(required, "ana")).toBeUndefined();
        expect(run(required, ["a"])).toBeUndefined();
        expect(run(required, true)).toBeUndefined();
    });
});

describe("br/cpf", () => {
    it("accepts a valid cpf, formatted or not", () => {
        expect(run(cpf, "529.982.247-25")).toBeUndefined();
        expect(run(cpf, "52998224725")).toBeUndefined();
    });

    it("rejects a wrong check digit", () => {
        expect(run(cpf, "529.982.247-24")).toBeTypeOf("string");
    });

    it("rejects repeated digits", () => {
        expect(run(cpf, "111.111.111-11")).toBeTypeOf("string");
    });

    it("rejects the wrong length", () => {
        expect(run(cpf, "5299822472")).toBeTypeOf("string");
    });

    it("skips empty values so required owns emptiness", () => {
        expect(run(cpf, "")).toBeUndefined();
        expect(run(cpf, undefined)).toBeUndefined();
    });
});

describe("br/cnpj", () => {
    it("accepts a valid cnpj, formatted or not", () => {
        expect(run(cnpj, "11.222.333/0001-81")).toBeUndefined();
        expect(run(cnpj, "11222333000181")).toBeUndefined();
    });

    it("rejects a wrong check digit", () => {
        expect(run(cnpj, "11.222.333/0001-82")).toBeTypeOf("string");
    });

    it("rejects repeated digits", () => {
        expect(run(cnpj, "11111111111111")).toBeTypeOf("string");
    });

    it("skips empty values", () => {
        expect(run(cnpj, "")).toBeUndefined();
    });
});

describe("br/cep", () => {
    it("accepts eight digits", () => {
        expect(run(cep, "01310-100")).toBeUndefined();
        expect(run(cep, "01310100")).toBeUndefined();
    });

    it("rejects any other length", () => {
        expect(run(cep, "0131010")).toBeTypeOf("string");
    });

    it("skips empty values", () => {
        expect(run(cep, "")).toBeUndefined();
    });
});

describe("br/telefone", () => {
    it("accepts landline and mobile numbers", () => {
        expect(run(telefone, "(11) 3333-4444")).toBeUndefined();
        expect(run(telefone, "(11) 93333-4444")).toBeUndefined();
    });

    it("rejects a mobile whose ninth digit is not 9", () => {
        expect(run(telefone, "(11) 83333-4444")).toBeTypeOf("string");
    });

    it("rejects an invalid area code", () => {
        expect(run(telefone, "(01) 3333-4444")).toBeTypeOf("string");
    });

    it("skips empty values", () => {
        expect(run(telefone, "")).toBeUndefined();
    });
});

describe("email", () => {
    it("accepts a plain address", () => {
        expect(run(email, "ana@exemplo.com.br")).toBeUndefined();
    });

    it("rejects malformed addresses", () => {
        expect(run(email, "ana@")).toBeTypeOf("string");
        expect(run(email, "ana exemplo.com")).toBeTypeOf("string");
    });

    it("skips empty values", () => {
        expect(run(email, "")).toBeUndefined();
    });
});

describe("url", () => {
    it("accepts an absolute url", () => {
        expect(run(url, "https://exemplo.com.br/a?b=1")).toBeUndefined();
    });

    it("rejects a value that is not a url", () => {
        expect(run(url, "exemplo")).toBeTypeOf("string");
    });

    it("skips empty values", () => {
        expect(run(url, "")).toBeUndefined();
    });
});

describe("min", () => {
    it("compares length for strings and arrays", () => {
        expect(run(min, "ab", { min: 3 })).toBeTypeOf("string");
        expect(run(min, "abc", { min: 3 })).toBeUndefined();
        expect(run(min, ["a"], { min: 2 })).toBeTypeOf("string");
        expect(run(min, ["a", "b"], { min: 2 })).toBeUndefined();
    });

    it("compares value for numbers", () => {
        expect(run(min, 2, { min: 3 })).toBeTypeOf("string");
        expect(run(min, 3, { min: 3 })).toBeUndefined();
    });

    it("skips empty values", () => {
        expect(run(min, "", { min: 3 })).toBeUndefined();
    });
});

describe("max", () => {
    it("compares length for strings and arrays", () => {
        expect(run(max, "abcd", { max: 3 })).toBeTypeOf("string");
        expect(run(max, "abc", { max: 3 })).toBeUndefined();
        expect(run(max, ["a", "b", "c", "d"], { max: 3 })).toBeTypeOf("string");
    });

    it("compares value for numbers", () => {
        expect(run(max, 4, { max: 3 })).toBeTypeOf("string");
        expect(run(max, 3, { max: 3 })).toBeUndefined();
    });
});

describe("mask presets", () => {
    it("ship maska options rather than bare patterns", () => {
        expect(maskCpf).toEqual({ mask: "###.###.###-##" });
        expect(maskCep).toEqual({ mask: "#####-###" });
    });

    it("express cpfCnpj as a dynamic mask", () => {
        expect(maskCpfCnpj.mask).toEqual(["###.###.###-##", "##.###.###/####-##"]);
    });
});

describe("plural", () => {
    /**
     * The bug the hand-rolled resolver shipped: `min: 1` read "Mínimo de 1
     * caracteres." An empty array is not blank, so the rule does not bail out
     * early and the message is reachable with a count of one.
     */
    it("says caractere in the singular", () => {
        expect(run(min, [], { min: 1 })).toBe("Mínimo de 1 caractere.");
    });

    it("says caracteres in the plural", () => {
        expect(run(min, "ab", { min: 5 })).toBe("Mínimo de 5 caracteres.");
    });

    it("does the same on the max side", () => {
        expect(run(max, "ab", { max: 1 })).toBe("Máximo de 1 caractere.");
        expect(run(max, "abcdef", { max: 2 })).toBe("Máximo de 2 caracteres.");
    });
});