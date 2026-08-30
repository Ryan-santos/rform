import { ref, type Ref } from "vue";
import { z, type ZodType, type ZodObject } from "zod";
import type { Schema, FieldConfig, InferData } from "#rform/types/schema";
import { rules as presets } from "#rform/presets";
import resolveRule from "../utils/resolveRule";
import { isZodType, zodToFn } from "../utils/zod";

/**
 * A preset validation may be async, so the aggregated object it produces has to
 * be read with `safeParseAsync`. Zod-only schemas stay synchronous.
 */
function toZod (rule: unknown): ZodType {
    if (rule === undefined || rule === null) {
        return z.any();
    }

    if (isZodType(rule)) {
        return rule as unknown as ZodType;
    }

    const validate = resolveRule(rule as never, presets as never);

    if (!validate) {
        return z.any();
    }

    return z.any().superRefine(async (value, ctx) => {
        const error = await validate(value, undefined);

        if (error) {
            ctx.addIssue({ code: "custom", message: error });
        }
    });
}

/**
 * Only zod schemas need flattening — every other shape is resolved by the field
 * itself, so it must survive untouched.
 */
function normalizeRule (rule: unknown) {
    return isZodType(rule) ? zodToFn(rule) : rule;
}

function aggregateRules (schema: Schema): ZodObject<Record<string, ZodType>> {
    const shape: Record<string, ZodType> = {};

    for (const [key, field] of Object.entries(schema)) {
        if ("slot" in field) {
            shape[key] = toZod(field.rule);
            continue;
        }

        if (field.type === "object") {
            shape[key] = aggregateRules(field.children);
            continue;
        }

        if (field.type === "array") {
            const child = field.children;

            if ("slot" in child) {
                shape[key] = z.array(toZod(child.rule));
            }
            else if (child.type === "object") {
                shape[key] = z.array(aggregateRules(child.children));
            }
            else {
                shape[key] = z.array(toZod(child.rule));
            }

            continue;
        }

        shape[key] = toZod(field.rule);
    }

    return z.object(shape);
}

type FieldOrSlot = Schema[string];

function normalizeField (field: FieldOrSlot): FieldOrSlot {
    if ("slot" in field) {
        return {
            ...field,
            rule: normalizeRule(field.rule) as ZodType
        };
    }

    if (field.type === "object") {
        return {
            ...field,
            rule: normalizeRule(field.rule) as ZodType,
            children: normalizeSchema(field.children)
        } as FieldConfig;
    }

    if (field.type === "array") {
        return {
            ...field,
            rule: normalizeRule(field.rule) as ZodType,
            children: normalizeField(field.children) as FieldConfig
        } as FieldConfig;
    }

    return {
        ...field,
        rule: normalizeRule(field.rule) as ZodType
    } as FieldConfig;
}

function normalizeSchema (schema: Schema): Schema {
    const out: Schema = {};

    for (const [key, field] of Object.entries(schema)) {
        out[key] = normalizeField(field);
    }

    return out;
}

function useRForm <T>(): { data: Ref<T> };
function useRForm <Z extends Record<string, ZodType>>(input: Z): {
    data: Ref<{ [K in keyof Z]: z.infer<Z[K]> }>;
    rules: ZodObject<Z>;
};
function useRForm <S extends Schema>(input: S): {
    data: Ref<InferData<S>>;
    rules: ZodObject<Record<string, ZodType>>;
    schema: S;
};
function useRForm (input?: unknown): unknown {
    if (input === undefined) {
        return { data: ref({}) };
    }

    const entries = Object.entries(input as Record<string, unknown>);
    const allZod = entries.length > 0 && entries.every(([, value]) => isZodType(value));

    if (allZod) {
        const rules = z.object(input as Record<string, ZodType>);
        return {
            data: ref({}),
            rules
        };
    }

    const schema = input as Schema;

    return {
        data: ref({}),
        rules: aggregateRules(schema),
        schema: normalizeSchema(schema)
    };
}

export default useRForm;
