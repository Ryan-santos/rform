import type { Base } from "#rform/types";
import mergerUI from "./mergerUI";

export type MergeObjects<Objects extends Array<unknown>>
    = Objects extends [infer First, ...infer Rest]
        ? First extends object
            ? Rest extends Array<object | null | undefined>
                ? Rest["length"] extends 0
                    ? First
                    : Omit<NonNullable<First>, keyof MergeObjects<Rest>> & MergeObjects<Rest>
                : First
            : NonNullable<First>
        : Objects[number];

type OBJ = Record<string | number, unknown> | null | undefined;

export default function merger<
    T extends Array<OBJ>
> (...objects: T) {
    return objects.reduce((result, current) => {
        if (!current || typeof current !== "object") {
            return result;
        }

        for (const key in current) {
            const resultValue = result?.[key];
            const currentValue = current[key];

            if (resultValue && !currentValue) {
                continue;
            }

            if (
                resultValue
                && currentValue
                && typeof currentValue === "object"
                && !Array.isArray(currentValue)
            ) {
                result[key] = key === "ui"
                    ? mergerUI(resultValue as Base["ui"], currentValue as Base["ui"])
                    : merger(resultValue as OBJ, currentValue as OBJ);

                continue;
            }

            if (result) {
                result[key] = currentValue;
            }
        };

        return result;
    }, {}) as MergeObjects<T>;
}