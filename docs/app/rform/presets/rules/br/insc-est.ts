import { defineRule, type RuleContext } from "#rform/utils";

export default defineRule({
    available: ["text"],
    validation({ value, uf }: RuleContext<{ value: string; uf: string }>) {
        if (!value) {
            return;
        }

        if (value.length < 9) {
            return `Inscrição estadual de ${uf} inválida.`;
        }
    }
});