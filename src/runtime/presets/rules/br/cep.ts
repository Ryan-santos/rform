import { z } from "zod";
import { defineRule, type RuleContext } from "../../../utils/definePreset";
import { check, digits, isBlank } from "../../helpers";

const schema = z.string().length(8, "CEP inválido.");

export default defineRule({
    available: ["text"],
    validation: ({ value }: RuleContext) =>
        isBlank(value) ? undefined : check(schema, digits(value))
});
