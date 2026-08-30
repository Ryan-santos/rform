import { z } from "zod";
import { defineRule, type RuleContext } from "../../../utils/definePreset";
import { allSameDigit, check, checkDigit, digits, isBlank } from "../../helpers";

const schema = z.string().refine((cnpj) => {
    if (cnpj.length !== 14 || allSameDigit(cnpj)) {
        return false;
    }

    return checkDigit(cnpj.slice(0, 12), 5) === Number(cnpj[12])
        && checkDigit(cnpj.slice(0, 13), 6) === Number(cnpj[13]);
}, "CNPJ inválido.");

export default defineRule({
    available: ["text"],
    validation: ({ value }: RuleContext) =>
        isBlank(value) ? undefined : check(schema, digits(value))
});
