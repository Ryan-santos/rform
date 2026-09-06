const pad = (value: number) => String(value).padStart(2, "0");

/** The separator goes into a regex verbatim, and `.` is a legitimate one. */
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export type DateToken = "D" | "M" | "Y";

/**
 * `true` requires the time part, `false` forbids it, `"optional"` accepts both
 * — which is what a value arriving from outside needs, since the same string
 * may or may not carry an hour.
 */
export type TimeMode = boolean | "optional";

export type DateFormat = {
    /** The pattern this was built from, normalised. */
    pattern: string;
    order: DateToken[];
    separator: string;
    /** A maska pattern: `##/##/####`, or `##/##/#### ##:##` with time. */
    mask: (time?: boolean) => string;
    format: (date: Date | null | undefined, time?: boolean) => string;
    parse: (input: string | null | undefined, time?: TimeMode) => Date | null;
};

const FALLBACK = "DD/MM/YYYY";

/**
 * Everything the module used to hardcode as `dd/mm/yyyy` — the maska pattern,
 * the parse regex and the display formatting — derived from one pattern string,
 * which comes from `formats.date` in the active locale pack.
 *
 * A pattern that does not yield exactly one day, one month and one year token
 * falls back to `DD/MM/YYYY` rather than producing a regex that matches nothing.
 */
export default function dateFormat(pattern?: string | null): DateFormat {
    const source = (pattern ?? "").trim() || FALLBACK;

    const tokens = source.match(/D+|M+|Y+/g) ?? [];
    const order = tokens.map((token) => token[0] as DateToken);

    const valid =
        order.length === 3 &&
        (["D", "M", "Y"] as DateToken[]).every((token) => order.includes(token));

    if (!valid) {
        return dateFormat(FALLBACK);
    }

    const separator = source.replace(/[DMY]/g, "").trim().charAt(0) || "/";

    const mask = (time = false) =>
        order.map((token) => (token === "Y" ? "####" : "##")).join(separator) +
        (time ? " ##:##" : "");

    const format = (date: Date | null | undefined, time = false) => {
        if (!date) {
            return "";
        }

        const parts: Record<DateToken, string> = {
            D: pad(date.getDate()),
            M: pad(date.getMonth() + 1),
            Y: String(date.getFullYear())
        };

        const day = order.map((token) => parts[token]).join(separator);

        return time ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
    };

    const expression = (time: TimeMode) => {
        const date = order
            .map((token) => (token === "Y" ? String.raw`(\d{4})` : String.raw`(\d{2})`))
            .join(escape(separator));

        const clock = String.raw`\s+(\d{2}):(\d{2})`;

        const tail = time === "optional" ? `(?:${clock})?` : time ? clock : "";

        return new RegExp(`^${date}${tail}$`);
    };

    const parse = (input: string | null | undefined, time: TimeMode = false) => {
        const trimmed = input?.trim() ?? "";

        if (!trimmed) {
            return null;
        }

        const matched = trimmed.match(expression(time));

        if (!matched) {
            return null;
        }

        const parts = { D: 0, M: 0, Y: 0 };

        order.forEach((token, index) => {
            parts[token] = Number(matched[index + 1]);
        });

        const hours = Number(matched[4] ?? 0);
        const minutes = Number(matched[5] ?? 0);

        const date = new Date(parts.Y, parts.M - 1, parts.D, hours, minutes);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        /**
         * The roundtrip is what rejects `31/02`: `new Date` rolls it over to
         * March 3 instead of failing.
         */
        if (
            date.getDate() !== parts.D ||
            date.getMonth() !== parts.M - 1 ||
            date.getFullYear() !== parts.Y
        ) {
            return null;
        }

        return date;
    };

    return {
        pattern: source,
        order,
        separator,
        mask,
        format,
        parse
    };
}