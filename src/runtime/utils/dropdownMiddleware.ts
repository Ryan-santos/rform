import { flip, offset, shift, size, type Middleware } from "@floating-ui/vue";

/** Space kept between the panel and the edge of the viewport. */
const VIEWPORT_GAP = 10;

/**
 * The height below which the panel stops shrinking and `flip()` takes over —
 * the search bar plus about two rows.
 *
 * It is what makes flipping possible at all. `size()` returns
 * `reset: { rects: true }` whenever `apply` changed the panel's dimensions,
 * which restarts the middleware chain, so `flip()` always measures a panel that
 * `size()` has already clamped to the space below: no overflow, no flip, and a
 * field near the bottom of the viewport opens a panel a few pixels tall instead
 * of one above itself. `autoUpdate` keeps recomputing while the panel is closed
 * (`v-show` leaves it in the tree at 0×0), so the clamp is there before the
 * first open.
 *
 * Refusing to shrink past this leaves the overflow for `flip()` to see. The
 * floor is deliberately allowed to overflow the viewport in the one case where
 * neither side has room for it.
 */
export const DROPDOWN_MIN_HEIGHT = 160;

export type DropdownMiddlewareOptions = {
    offset?: number
    middleware?: Middleware[]
};

/**
 * Sizes the panel against its field: the reference's width, and the height that
 * is free on the side `flip()` settled on.
 *
 * The width leaves as a custom property instead of as `width`, because an
 * inline `width` beats every class there is: a `ui.Utils.Dropdown.popover` of
 * `w-80` had no way of winning, and lost without a word. The panel reads the
 * measurement back through the `w-(--width)` the field keeps in its own `ui`,
 * so overriding the width is overriding a class — `twMerge` drops
 * `w-(--width)` for whatever the app wrote, and the measurement stops being
 * read at all.
 *
 * `setProperty` is the only way in: a custom property assigned onto a
 * `CSSStyleDeclaration` lands as a plain JS property on the object and never
 * reaches CSS — the same silent failure, one layer down.
 */
export const dropdownFit = (minHeight: number = DROPDOWN_MIN_HEIGHT): Middleware =>
    size({
        apply({ availableHeight, elements, rects }) {
            elements.floating.style.setProperty(
                "--width",
                `${Math.max(0, rects.reference.width)}px`
            );
            elements.floating.style.maxHeight
                = `${Math.max(minHeight, availableHeight - VIEWPORT_GAP)}px`;
        }
    });

/**
 * The chain every `RUtilsDropdown` positions with. A field's own middleware
 * comes last, after `flip()`, which is where `size()` belongs under its default
 * `bestFit` strategy.
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
