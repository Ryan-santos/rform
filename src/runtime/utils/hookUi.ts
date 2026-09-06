import type { Base } from "#rform/types";

type UI = Base["ui"] | undefined;

/**
 * Prepende a classe-gancho do componente (`RField RText`, `RUtil RUtilsPlaceholder`)
 * na entrada mais alta do `ui` já mesclado — é ela que dá alvo aos resets de
 * `src/runtime/style.css`, em campo solto inclusive. Roda depois do `merger` e
 * nunca nos defaults; o porquê está em "As classes-gancho entram pelo `ui`" no
 * `.claude/CLAUDE.md`.
 *
 * @example hookUi({ container: "flex" }, "RField RText") // → { container: "RField RText flex" }
 */
export default (ui: UI, hook: string | undefined): UI => {
    // `Form` e `Dynamic` não recebem gancho: nenhum dos dois é campo.
    if (!hook) {
        return ui;
    }

    const prepend = (classes: unknown) => (classes ? `${hook} ${classes as string}` : hook);

    if (!ui || typeof ui === "string") {
        return prepend(ui);
    }

    // "Mais alta" é a primeira entrada que guarda classes, não um grupo aninhado.
    const top = Object.keys(ui).find((key) => !ui[key] || typeof ui[key] === "string");

    // Só grupos: componente que não renderiza elemento próprio não tem onde carregar
    // a classe — e não tem reset a perder.
    return top ? { ...ui, [top]: prepend(ui[top]) } : ui;
};