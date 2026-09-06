import { ref, type Ref } from "vue";

/**
 * `#app` for the unit project, which runs in plain node with no Nuxt around —
 * the same way it already stubs every `#rform/*` alias.
 *
 * `tryUseNuxtApp` returning `undefined` is not a mock of a behaviour: it is
 * exactly the branch `useTranslate` already has for a component mounted outside
 * a Nuxt app, so the unit tests exercise the real path.
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
