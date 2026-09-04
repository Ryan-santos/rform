import { computePosition, type Middleware } from "@floating-ui/vue";
import { describe, expect, it } from "vitest";

import dropdownMiddleware, { dropdownFit } from "../../src/runtime/utils/dropdownMiddleware";

/**
 * `size()` and `flip()` fight over the same element, and `size()` wins by
 * default: it returns `reset: { rects: true }` whenever `apply` changed the
 * panel's dimensions, which restarts the whole middleware chain — so on the
 * next pass `flip()` measures a panel that was *already* clamped to whatever
 * fits below, sees no overflow, and keeps `bottom-start` forever.
 *
 * The state is real and not hypothetical: `autoUpdate` keeps recomputing while
 * the panel is closed (`v-show` leaves it in the tree at 0×0), so it opens with
 * a `maxHeight` measured for the space below.
 *
 * The whole loop lives in the DOM's layout, which no test environment here has,
 * so these drive the real `computePosition` over a synthetic platform: a fixed
 * viewport as the clipping rect, and a panel whose height is its content height
 * clamped by the `maxHeight` that `apply` wrote — exactly what a browser does.
 */

const VIEWPORT = { x: 0, y: 0, width: 1000, height: 800 };

type Panel = {
    natural: { width: number, height: number }
    style: Record<string, string>
};

const parse = (value: string | undefined) => {
    return value ? Number.parseFloat(value) : Number.POSITIVE_INFINITY;
};

const platform = {
    getElementRects: async ({ reference, floating }: { reference: unknown, floating: unknown }) => ({
        reference: reference as { x: number, y: number, width: number, height: number },
        floating: { x: 0, y: 0, ...(await platform.getDimensions(floating as Panel)) }
    }),
    getDimensions: async (panel: Panel) => ({
        width: Math.min(panel.natural.width, parse(panel.style.width)),
        height: Math.min(panel.natural.height, parse(panel.style.maxHeight))
    }),
    getClippingRect: async () => VIEWPORT,
    getOffsetParent: async () => null,
    getDocumentElement: async () => null,
    convertOffsetParentRelativeRectToViewportRelativeRect: async (
        { rect }: { rect: { x: number, y: number, width: number, height: number } }
    ) => rect,
    isElement: async () => true,
    isRTL: async () => false,
    getScale: async () => ({ x: 1, y: 1 })
};

const field = (top: number) => ({ x: 100, y: top, width: 300, height: 50 });

const panel = (height: number): Panel => ({
    natural: { width: 300, height },
    style: {}
});

const place = (
    reference: ReturnType<typeof field>,
    floating: Panel,
    middleware: Middleware[]
) => {
    return computePosition(reference as never, floating as never, {
        placement: "bottom-start",
        strategy: "fixed",
        middleware,
        platform: platform as never
    });
};

/** Opening is the second computation: the first one ran with the panel hidden. */
const open = async (reference: ReturnType<typeof field>, content: number) => {
    const floating = panel(0);
    const middleware = dropdownMiddleware({ middleware: [dropdownFit()] });

    await place(reference, floating, middleware);
    floating.natural.height = content;

    const { placement } = await place(reference, floating, middleware);

    return { placement, maxHeight: parse(floating.style.maxHeight), style: floating.style };
};

describe("dropdownMiddleware", () => {
    it("keeps the panel below the field when the space below fits it", async () => {
        const { placement } = await open(field(100), 600);

        expect(placement).toBe("bottom-start");
    });

    it("flips the panel above a field sitting at the bottom of the viewport", async () => {
        const { placement } = await open(field(700), 600);

        expect(placement).toBe("top-start");
    });

    it("gives the flipped panel the room above instead of the minimum", async () => {
        const { maxHeight } = await open(field(700), 600);

        // 700 - 5 of offset - 10 of gap
        expect(maxHeight).toBe(685);
    });

    it("shrinks to the room below when the field has some, without flipping", async () => {
        const { placement, maxHeight } = await open(field(400), 600);

        expect(placement).toBe("bottom-start");
        // 800 - 450 - 5 of offset - 10 of gap
        expect(maxHeight).toBe(335);
    });

    it("matches the reference width", async () => {
        const { style } = await open(field(100), 600);

        expect(style.width).toBe("300px");
    });
});
