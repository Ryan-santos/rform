import { ref, type Ref } from "vue";
import { z, type ZodType, type ZodObject } from "zod";
import type { Schema, FieldConfig, InferData } from "#rform/types/schema";

function isZodType (value: unknown): value is ZodType {
    return !!value
        && typeof value === "object"
        && "_def" in value
        && "safeParse" in value
        && typeof (value as { safeParse: unknown }).safeParse === "function";
}

function zodToFn (schema: ZodType) {
    return (value: unknown) => {
        const result = schema.safeParse(value);
        if (!result.success) {
            return result.error.issues[0]?.message;
        }
    };
}

function aggregateRules (schema: Schema): ZodObject<Record<string, ZodType>> {
    const shape: Record<string, ZodType> = {};

    for (const [key, field] of Object.entries(schema)) {
        if ("slot" in field) {
            shape[key] = field.rule ?? z.any();
            continue;
        }

        if (field.type === "object") {
            shape[key] = aggregateRules(field.children);
            continue;
        }

        if (field.type === "array") {
            const child = field.children;

            if ("slot" in child) {
                shape[key] = z.array(child.rule ?? z.any());
            }
            else if (child.type === "object") {
                shape[key] = z.array(aggregateRules(child.children));
            }
            else {
                shape[key] = z.array(child.rule ?? z.any());
            }

            continue;
        }

        shape[key] = field.rule ?? z.any();
    }

    return z.object(shape);
}

type FieldOrSlot = Schema[string];

function normalizeField (field: FieldOrSlot): FieldOrSlot {
    if ("slot" in field) {
        return {
            ...field,
            rule: field.rule ? (zodToFn(field.rule) as unknown as ZodType) : undefined
        };
    }

    if (field.type === "object") {
        return {
            ...field,
            rule: field.rule ? (zodToFn(field.rule) as unknown as ZodType) : undefined,
            children: normalizeSchema(field.children)
        } as FieldConfig;
    }

    if (field.type === "array") {
        return {
            ...field,
            rule: field.rule ? (zodToFn(field.rule) as unknown as ZodType) : undefined,
            children: normalizeField(field.children) as FieldConfig
        } as FieldConfig;
    }

    return {
        ...field,
        rule: field.rule ? (zodToFn(field.rule) as unknown as ZodType) : undefined
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
