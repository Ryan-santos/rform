import { z } from "zod";

import { defineRule, type RuleContext } from "../../utils/definePreset";
import { trRule } from "../../utils/tr";
import { check } from "../helpers";

// Mais largo que `isBlank`: `false` e `[]` são valores preenchidos em todo o resto,
// mas switch desmarcado e lista vazia são exatamente o que esta rule existe para
// pegar. Zero não é vazio. Fábrica, e não constante de módulo, porque `trRule`
// resolve na construção e o locale muda sem a página recarregar.
const schema = () =>
    z.custom<unknown>(
        (value) =>
            !(
                value === undefined ||
                value === null ||
                value === false ||
                (typeof value === "string" && value.trim() === "") ||
                (Array.isArray(value) && value.length === 0)
            ),
        trRule("required")
    );

/** Exige um valor preenchido. Switch desmarcado e lista vazia contam como vazio; zero não. */
export default defineRule({
    validation: ({ value }: RuleContext) => check(schema(), value)
});