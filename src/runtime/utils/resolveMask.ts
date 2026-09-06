import type { MaskInputOptions } from "maska";

export type MaskPreset = MaskInputOptions;

export type Masks = Record<string, MaskPreset>;

export type MaskRef = string | MaskPreset;

/**
 * Resolve o `mask`: nome de preset ganha, o resto vai cru pro maska.
 *
 * @example resolveMask("brCpf", masks) // → { mask: "###.###.###-##" }
 * @example resolveMask("##/##", masks) // → "##/##"
 */
export default function resolveMask(
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
}