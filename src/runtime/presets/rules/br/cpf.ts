import { z } from "zod";

import { defineRule, type RuleContext } from "../../../utils/definePreset";
import { trRule } from "../../../utils/tr";
import { allSameDigit, check, checkDigit, digits, isBlank } from "../../helpers";

const schema = () =>
    z.string().refine((cpf) => {
        if (cpf.length !== 11 || allSameDigit(cpf)) {
            return false;
        }

        return (
            checkDigit(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
            checkDigit(cpf.slice(0, 10), 11) === Number(cpf[10])
        );
    }, trRule("br.cpf"));

/** Exige um CPF válido, conferindo os dois dígitos verificadores. */
export default defineRule({
    available: ["text"],
    validation: ({ value }: RuleContext) =>
        isBlank(value) ? undefined : check(schema(), digits(value))
});