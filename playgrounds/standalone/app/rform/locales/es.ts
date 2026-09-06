import { defineLocale } from "#rform/utils";

/**
 * Um code que o módulo não tem. Ele simplesmente entra, e o que faltar cai no
 * `fallbackLocale` — que é o pack default.
 */
export default defineLocale({
    fields: {
        array: {
            add: "Añadir"
        }
    },
    presets: {
        rules: {
            required: "Este campo es obligatorio."
        }
    }
});