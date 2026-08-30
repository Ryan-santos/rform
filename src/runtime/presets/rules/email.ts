import { z } from "zod";
import { defineRule, type RuleContext } from "../../utils/definePreset";
import { check, isBlank, text } from "../helpers";

const schema = z.email("E-mail inválido.");

export default defineRule({
    available: ["text"],
    validation: ({ value }: RuleContext) =>
        isBlank(value) ? undefined : check(schema, text(value))
});
