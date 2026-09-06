import { z } from "zod";

import { defineRule, type RuleContext } from "../../../utils/definePreset";
import { trRule } from "../../../utils/tr";
import { check, digits, isBlank } from "../../helpers";

const schema = () => z.string().length(8, trRule("br.cep"));

/** Exige um CEP com 8 dígitos. Aceita com ou sem pontuação. */
export default defineRule({
    available: ["text"],
    validation: ({ value }: RuleContext) =>
        isBlank(value) ? undefined : check(schema(), digits(value))
});