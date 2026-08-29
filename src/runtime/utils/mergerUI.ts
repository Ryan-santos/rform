import type { Base } from "#rform/types";
import { twMerge } from "tailwind-merge";

export default function mergerUI<
    T extends (Base["ui"] | undefined)[],
    I = NonNullable<T[number]>
> (...objects: T): I | undefined {
    const validObjects = objects.filter(obj => obj !== undefined);

    if (validObjects.length === 0) {
        return undefined;
    }

    if (validObjects.length === 1) {
        return validObjects[0] as unknown as I;
    }

    if (validObjects.every(obj => typeof obj === "string")) {
        return twMerge(...(validObjects as string[])) as unknown as I;
    }

    const [
        target,
        ...sources
    ] = validObjects as Record<string, unknown>[];

    const result = { ...target };

    for (const source of sources) {
        for (const key in source) {
            if (source[key] !== undefined) {
                if (source[key] !== null) {
                    if (typeof source[key] === "string" || Array.isArray(source[key])) {
                        result[key] = twMerge((result[key] as string), (source[key] as string));
                    }
                    else {
                        result[key] = mergerUI((result[key] as Record<string, unknown>), (source[key] as unknown as Record<string, unknown>));
                    }
                }
                else {
                    result[key] = source[key];
                }
            }
        }
    }

    return result as unknown as I;
}