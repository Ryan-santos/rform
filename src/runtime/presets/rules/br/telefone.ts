import { z } from "zod";
import { defineRule, type RuleContext } from "../../../utils/definePreset";
import { check, digits, isBlank } from "../../helpers";

const schema = z.string().refine((phone) => {
    if (phone.length !== 10 && phone.length !== 11) {
        return false;
    }

    // Area codes start at 11, and an eleven-digit number is a mobile, which
    // always carries the extra 9.
    return Number(phone.slice(0, 2)) >= 11
        && (phone.length === 10 || phone[2] === "9");
}, "Telefone inválido.");

export default defineRule({
    available: ["text"],
    validation: ({ value }: RuleContext) =>
        isBlank(value) ? undefined : check(schema, digits(value))
});
