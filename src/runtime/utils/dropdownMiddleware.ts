import { flip, offset, shift, size, type Middleware } from "@floating-ui/vue";

/** Folga entre o painel e a borda da viewport. */
const VIEWPORT_GAP = 10;

/**
 * Altura abaixo da qual o painel para de encolher e o `flip()` assume — a busca
 * mais umas duas linhas. É o piso que torna o flip possível; ver "`size()` do
 * floating-ui sempre ganha do `flip()`" no `.claude/CLAUDE.md`.
 */
export const DROPDOWN_MIN_HEIGHT = 160;

export type DropdownMiddlewareOptions = {
    offset?: number;
    middleware?: Middleware[];
};

/**
 * Dimensiona o painel contra o campo: a largura da referência e a altura livre do
 * lado em que o `flip()` parou.
 *
 * As duas saem como custom property, não como `width`/`max-height`: inline
 * ganharia de qualquer classe, e um `ui.Utils.Dropdown.popover` de `w-80` ou de
 * `[--max-height:30rem]` perderia calado. Quem lê é o `popover` do Dropdown.
 *
 * @example middleware: [dropdownFit()]
 */
export const dropdownFit = (minHeight: number = DROPDOWN_MIN_HEIGHT): Middleware =>
    size({
        apply({ availableHeight, elements, rects }) {
            elements.floating.style.setProperty(
                "--width",
                `${Math.max(0, rects.reference.width)}px`
            );
            elements.floating.style.setProperty(
                "--available-height",
                `${Math.max(minHeight, availableHeight - VIEWPORT_GAP)}px`
            );
        }
    });

/**
 * A cadeia com que todo `RUtilsDropdown` posiciona. O middleware do campo vem por
 * último, depois do `flip()` — que é onde o `size()` pertence na estratégia default.
 *
 * @example dropdownMiddleware({ middleware: [dropdownFit()] })
 */
export default ({
    offset: distance = 5,
    middleware = []
}: DropdownMiddlewareOptions = {}): Middleware[] => [
    offset(distance),
    flip(),
    shift(),
    ...middleware
];