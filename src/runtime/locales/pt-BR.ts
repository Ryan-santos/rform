/**
 * O pack de referência: é o `typeof` dele que vira `Messages` em
 * `#rform/types/locales`, e é ele que responde por uma chave que falta em
 * qualquer outro pack.
 *
 * Interpolação `{param}` — a mesma sintaxe do vue-i18n, então o arquivo serve
 * tanto à ponte com @nuxtjs/i18n quanto ao resolvedor próprio, sem tradução.
 *
 * `fields.*` e `utils.*` espelham `components/fields` e `components/utils`, que
 * é de onde o prefixo automático sai: o `defaults.text` de um campo vira
 * `rform.fields.<campo>.*` e o de um util vira `rform.utils.<util>.*`. Sem essa
 * separação um campo e um util de mesmo nome (hoje `Calendar` é os dois)
 * disputariam a mesma chave.
 *
 * Um `@` literal numa mensagem precisa ser escrito `{'@'}` — `@:chave` é a
 * sintaxe de mensagem ligada do vue-i18n, e um e-mail cru derruba o parser com
 * "Invalid linked format (error code: 10)".
 */
export default {
    fields: {
        array: {
            add: "Adicionar"
        },
        select: {
            search: "Pesquisar"
        },
        file: {
            placeholder: "Arraste ou clique aqui para adicionar:",
            loading: "Carregando...",
            zero: "0 Byte",
            bytes: {
                b: "Bytes",
                kb: "KB",
                mb: "MB",
                gb: "GB",
                tb: "TB"
            }
        },
        date: {
            hint: "dd/mm/aaaa",
            hintTime: "dd/mm/aaaa hh:mm",
            separator: "até"
        },
        hour: {
            hint: "hh:mm",
            separator: "até"
        }
    },
    utils: {
        calendar: {
            start: "Início",
            end: "Fim",
            time: "Hora"
        }
    },
    /**
     * Pareia com o layout de `src/runtime/presets/{rules,masks}` e deixa espaço
     * para `presets.masks.*` se um dia houver mensagem lá.
     */
    presets: {
        rules: {
            required: "Campo obrigatório.",
            min: {
                number: "Valor mínimo: {min}.",
                length: "Mínimo de {min} caractere. | Mínimo de {min} caracteres."
            },
            max: {
                number: "Valor máximo: {max}.",
                length: "Máximo de {max} caractere. | Máximo de {max} caracteres."
            },
            email: "E-mail inválido.",
            url: "URL inválida.",
            br: {
                cpf: "CPF inválido.",
                cnpj: "CNPJ inválido.",
                cep: "CEP inválido.",
                telefone: "Telefone inválido."
            }
        }
    },
    /**
     * De onde saem máscara, regex de parse e formatação de exibição — tudo o
     * que `dateFormat` deriva. `formats.date` usa os tokens `D`, `M` e `Y`.
     */
    formats: {
        date: "DD/MM/YYYY"
    }
};