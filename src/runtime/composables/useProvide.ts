import { provide } from "vue";

import { key, type Value } from "./useInjection";

export default function (value: Value) {
    return provide(key, value);
}