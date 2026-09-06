import { defineLocale } from "#rform/utils";

/**
 * Cobre o caminho do pack do usuário: mesmo code **mescla** por cima do
 * embutido, então só esta chave muda e o resto do pt-BR continua inteiro.
 */
export default defineLocale({
    fields: {
        array: {
            add: "Incluir"
        }
    }
});