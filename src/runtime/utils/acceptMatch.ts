/** O mínimo que o matcher lê de um arquivo — o `File` do browser satisfaz. */
type Named = {
    name: string;
    type?: string;
};

export type Accept = {
    /** O valor para o `accept` do `<input>`, ou `undefined` quando tudo passa. */
    attr: string | undefined;
    /** As entradas normalizadas, na ordem escrita: é o que as badges mostram. */
    list: string[];
    matches: (file: Named) => boolean;
};

const normalize = (token: string): string => {
    const lower = token.toLowerCase();

    // MIME e o curinga solto passam intactos; o resto é extensão, e o input nativo
    // só entende extensão com ponto.
    if (lower === "*" || lower.includes("/")) {
        return lower;
    }

    return `.${lower.replace(/^\.+/, "")}`;
};

/**
 * Lê o `accept` do campo e devolve o que o input e o filtro precisam. Casa extensão
 * (`png`, `.png`), MIME exato (`application/pdf`) e curinga (`image/*`) — o filtro
 * de hoje olha só a extensão do nome, então o `image/*` do próprio JSDoc nunca casa.
 *
 * @example acceptMatch("png, image/*") // → { attr: ".png,image/*", list: [".png", "image/*"], matches }
 */
export default (accept?: string): Accept => {
    const list = [
        ...new Set(
            (accept ?? "")
                .split(",")
                .map((token) => token.trim())
                .filter(Boolean)
                .map(normalize)
        )
    ];

    if (list.length === 0) {
        return { attr: undefined, list, matches: () => true };
    }

    const matches = (file: Named): boolean => {
        const name = file.name.toLowerCase();
        const type = (file.type ?? "").toLowerCase();

        return list.some((token) => {
            if (token === "*") {
                return true;
            }

            if (token.endsWith("/*")) {
                return !!type && type.startsWith(token.slice(0, -1));
            }

            if (token.includes("/")) {
                return type === token;
            }

            return name.endsWith(token);
        });
    };

    return { attr: list.join(","), list, matches };
};