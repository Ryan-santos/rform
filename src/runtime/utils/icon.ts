/**
 * Prefixa o nome curto de um ícone com o namespace do módulo, que é como os aliases
 * são registrados no `@nuxt/icon`. Ver "Os ícones vivem num namespace" no
 * `.claude/CLAUDE.md`: sem o prefixo, os 16 aliases caíam no espaço global do app.
 *
 * Um campo ou util do usuário chama isto para reusar o conjunto do módulo em vez de
 * repetir o nome do iconify — e para acompanhar o override que o app tenha feito.
 *
 * @example icon("calendar") // → "rform:calendar"
 * @example <Icon :name="icon('plus')" />
 */
export default function icon(name: string): string {
    return `rform:${name}`;
}