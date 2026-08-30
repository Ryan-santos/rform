import { defineFieldDefaults } from "#rform/utils";

export default defineFieldDefaults({
    Text: {
        ui: {
            label: {
                required: "text-amber-400"
            },
            Utils: {
                Placeholder: {
                    default: "text-red-400"
                }
            }
        }
    },
    Utils: {
        Placeholder: {
            ui: {
                default: "text-amber-400"
            }
        }
    }
});