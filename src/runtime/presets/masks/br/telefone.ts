import { defineMask } from "../../../utils/definePreset";

/** Telefone brasileiro, fixo ou celular. */
export default defineMask({
    mask: ["(##) ####-####", "(##) #####-####"]
});