import { defineFieldDefaults } from "#rform/utils";

/**
 * O arquivo do projeto: entra no merger entre o `defaults` do componente e as
 * props do call site, então **prop no campo sempre ganha**.
 */
export default defineFieldDefaults({
    Text: {
        ui: {
            container: "gap-2",
            group: {
                field: {
                    input: "p-4 text-base"
                }
            }
        }
    },
    Select: {
        ui: {
            Utils: {
                Dropdown: {
                    popover: "w-80"
                }
            }
        }
    },
    Utils: {
        Placeholder: {
            ui: {
                default: "text-xs uppercase tracking-widest"
            }
        },
        Error: {
            ui: {
                container: "text-xs italic"
            }
        }
    }
});