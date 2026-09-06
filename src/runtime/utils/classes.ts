type ClassValue = string | { [key: string]: ClassValue | null };

/**
 * Alarga literal de volta pra `string`, mantendo a forma do objeto. Sem isso o `T`
 * inferido prende cada default na classe exata, e sobrescrever `ui` não tipa.
 */
type Widen<T> = T extends string
    ? string
    : T extends null
      ? null
      : T extends Array<infer U>
        ? Array<Widen<U>>
        : { [K in keyof T]: Widen<T[K]> };

/**
 * Marca um bloco de classes como `ui`, alargando os literais para o call site
 * poder sobrescrever chave a chave.
 */
export default function <T extends ClassValue | Array<ClassValue>>(classes: T): Widen<T> {
    return classes as unknown as Widen<T>;
}