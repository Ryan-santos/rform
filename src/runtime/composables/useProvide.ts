import { provide } from "vue";

import { key, type Value } from "./useField";

/** Provê a raiz da injeção aos filhos. Só containers chamam: Form, Array e Object. */
export default function (value: Value) {
    return provide(key, value);
}