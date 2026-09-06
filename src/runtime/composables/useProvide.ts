import { provide } from "vue";

import { key, type Value } from "./useField";

export default function (value: Value) {
    return provide(key, value);
}