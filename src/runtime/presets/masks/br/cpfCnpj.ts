import { defineMask } from "../../../utils/definePreset";

/** CPF ou CNPJ, escolhido pelo comprimento digitado. */
export default defineMask({
    mask: ["###.###.###-##", "##.###.###/####-##"]
});