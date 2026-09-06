import { z } from "zod";

import { defineRule, type RuleContext } from "../../../utils/definePreset";
import { trRule } from "../../../utils/tr";
import { check, digits, isBlank } from "../../helpers";

const schema = () =>
    z.string().refine((phone) => {
        if (phone.length !== 10 && phone.length !== 11) {
            return false;
        }

        // DDD começa em 11, e onze dígitos é celular, que sempre carrega o 9.
        return Number(phone.slice(0, 2)) >= 11 && (phone.length === 10 || phone[2] === "9");
    }, trRule("br.telefone"));

/** Exige um telefone brasileiro válido: DDD real, e o 9 do celular. */
export default defineRule({
    available: ["text"],
    validation: ({ value }: RuleContext) =>
        isBlank(value) ? undefined : check(schema(), digits(value))
});