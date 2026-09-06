import type { Base } from "#rform/types";

import mergerUI from "./mergerUI";

export type MergeObjects<Objects extends Array<unknown>> = Objects extends [
    infer First,
    ...infer Rest
]
    ? First extends object
        ? Rest extends Array<object | null | undefined>
            ? Rest["length"] extends 0
                ? First
                : Omit<NonNullable<First>, keyof MergeObjects<Rest>> & MergeObjects<Rest>
            : First
        : NonNullable<First>
    : Objects[number];

type OBJ = Record<string | number, unknown> | null | undefined;

export default function merger<T extends Array<OBJ>>(...objects: T) {
    return objects.reduce((result, current) => {
        if (!current || typeof current !== "object") {
            return result;
        }

        for (const key in current) {
            const resultValue = result?.[key];
            const currentValue = current[key];

            /**
             * `undefined` means "not provided", never "clear it". It has to be
             * skipped before the truthiness guard below, which would otherwise
             * let an absent prop wipe a falsy default — `defineProps` fills
             * every declared key, so a plain `<RText name="x" />` arrives with
             * `default: undefined` and used to erase the component's own `""`.
             */
            if (currentValue === undefined) {
                continue;
            }

            if (resultValue && !currentValue) {
                continue;
            }

            if (
                resultValue &&
                currentValue &&
                typeof currentValue === "object" &&
                !Array.isArray(currentValue)
            ) {
                result[key] =
                    key === "ui"
                        ? mergerUI(resultValue as Base["ui"], currentValue as Base["ui"])
                        : merger(resultValue as OBJ, currentValue as OBJ);

                continue;
            }

            if (result) {
                result[key] = currentValue;
            }
        }

        return result;
    }, {}) as MergeObjects<T>;
}