import type { Base } from "../../type";

export default function <T extends Base> (props: T) {
    return props as T;
}