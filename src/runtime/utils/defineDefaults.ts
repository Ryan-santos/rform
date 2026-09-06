import type { Base } from "../../type";

/**
 * Identidade tipada: prende o `defaults` de um componente na forma de `Base`
 * (`ui`, `default`, `text`, `label`, `placeholder`) sem alargar os literais.
 */
export default function <T extends Base>(props: T) {
    return props as T;
}