import type { MaskInputOptions } from "maska";

export type MaskPreset = MaskInputOptions;

export type Masks = Record<string, MaskPreset>;

export type MaskRef = string | MaskPreset;

/**
 * Resolves a `mask` prop: a preset name wins, anything else goes straight to
 * maska as a raw pattern or options object.
 */
export default function resolveMask (
    ref: MaskRef | null | undefined,
    masks: Masks
): MaskRef | undefined {
    if (ref === null || ref === undefined) {
        return undefined;
    }

    if (typeof ref === "string") {
        return masks[ref] ?? ref;
    }

    return ref;
};
