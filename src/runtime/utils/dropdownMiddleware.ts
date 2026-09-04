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
 */
export const dropdownFit = (minHeight: number = DROPDOWN_MIN_HEIGHT): Middleware =>
    size({
        apply({ availableHeight, elements, rects }) {
            Object.assign(elements.floating.style, {
                width: `${Math.max(0, rects.reference.width)}px`,
                maxHeight: `${Math.max(minHeight, availableHeight - VIEWPORT_GAP)}px`
            });
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
