import { defineLocale } from "#rform/utils";

/**
 * Pack do usuário. **Mesmo code mescla**, não substitui — diferente de campo,
 * util e preset, onde mesmo nome troca o arquivo inteiro. Três chaves aqui e o
 * resto continua vindo do pack embutido.
 */
export default defineLocale({
    fields: {
        array: {
            add: "Incluir mais um"
        }
    },
    presets: {
        rules: {
            required: "Este campo não pode ficar vazio."
        }
    }
});