import { defineRule, type RuleContext } from "#rform/utils";

export default defineRule({
    validation ({ value }: RuleContext) {
        if (value === undefined || value === null || value === "") {
            return "Preencha este campo.";
        }
    }
});
