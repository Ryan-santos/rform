// Tupla, para o expoente escolhido continuar sendo chave de `text.bytes`: um
// `string[]` indexado alargaria para `string` e pararia de resolver.
const UNITS = ["b", "kb", "mb", "gb", "tb"] as const;

export type ByteUnit = (typeof UNITS)[number];

export type Bytes = {
    value: number;
    unit: ByteUnit;
};

/**
 * Bytes na maior unidade que couber. Devolve o par, e não a string: a unidade é
 * chave de `text.bytes.*` e quem traduz é o componente — é o que mantém a função
 * pura e testável sem `tr`.
 *
 * @example formatBytes(1536) // → { value: 1.5, unit: "kb" }
 */
export default (bytes: number): Bytes => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return { value: 0, unit: UNITS[0] };
    }

    const step = Math.floor(Math.log(bytes) / Math.log(1024));
    const index = Math.min(step, UNITS.length - 1);

    return {
        value: Math.round((bytes / 1024 ** index) * 10) / 10,
        unit: UNITS[index] ?? UNITS[0]
    };
};