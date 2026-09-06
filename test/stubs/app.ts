import { ref, type Ref } from "vue";

/**
 * O `#app` do projeto unit, que roda em node puro sem Nuxt em volta — do mesmo
 * jeito que ele já stuba todo alias `#rform/*`.
 *
 * `tryUseNuxtApp` devolvendo `undefined` não é mock de comportamento: é exatamente
 * o ramo que o `useTranslate` já tem para componente montado fora de app Nuxt.
 */
export const tryUseNuxtApp = (): undefined => undefined;

export const useNuxtApp = (): never => {
    throw new Error("[rform] useNuxtApp is not available outside a Nuxt app.");
};

const states = new Map<string, Ref<unknown>>();

export const useState = <T>(key: string, init?: () => T): Ref<T> => {
    if (!states.has(key)) {
        states.set(key, ref(init?.()) as Ref<unknown>);
    }

    return states.get(key) as Ref<T>;
};