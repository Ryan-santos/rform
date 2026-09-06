import { defineMask } from "../../../utils/definePreset";

/** Placa de veículo, no padrão antigo ou no Mercosul. */
export default defineMask({
    mask: ["@@@-####", "@@@#@##"]
});