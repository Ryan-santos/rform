import { defineEventHandler, getQuery } from "h3";

/**
 * O schema do RDynamic chegando pela rede, e não do bundle. É a forma que o
 * módulo foi feito para suportar — um formulário que o backend descreve.
 */
const pj = {
    empresa: { type: "text", label: "empresa.razaoSocial", rule: "required" },
    cnpj: { type: "text", label: "empresa.cnpj", mask: "brCnpj", rule: "brCnpj" },
    abertura: { type: "date", label: "empresa.abertura" },
    endereco: {
        type: "object",
        label: "form.endereco",
        children: {
            cep: { type: "text", label: "form.cep", mask: "brCep", rule: "brCep" },
            cidade: { type: "text", label: "empresa.cidade" }
        }
    }
};

const pf = {
    nome: { type: "text", label: "form.nome", rule: "required" },
    cpf: { type: "text", label: "form.cpf", mask: "brCpf", rule: "brCpf" },
    nascimento: { type: "date", label: "form.nascimento" }
};

export default defineEventHandler((event) => (getQuery(event).tipo === "pf" ? pf : pj));