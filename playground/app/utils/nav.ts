export type NavItem = {
    label: string;
    tag: string;
    to: string;
};

export type NavGroup = {
    title: string;
    items: NavItem[];
};

/**
 * The single source of the sidebar. Declared rather than derived from the route
 * table so the order is the one that makes sense to read, not alphabetical by
 * accident of the filesystem.
 */
export const nav: NavGroup[] = [
    {
        title: "Formulário",
        items: [
            { label: "Form", tag: "RForm", to: "/form" },
            { label: "Dynamic", tag: "RDynamic", to: "/dynamic" }
        ]
    },
    {
        title: "Campos",
        items: [
            { label: "Array", tag: "RArray", to: "/campos/array" },
            { label: "Calendar", tag: "RCalendar", to: "/campos/calendar" },
            { label: "Color", tag: "RColor", to: "/campos/color" },
            { label: "Date", tag: "RDate", to: "/campos/date" },
            { label: "File", tag: "RFile", to: "/campos/file" },
            { label: "Hour", tag: "RHour", to: "/campos/hour" },
            { label: "Number", tag: "RNumber", to: "/campos/number" },
            { label: "Object", tag: "RObject", to: "/campos/object" },
            { label: "Pin", tag: "RPin", to: "/campos/pin" },
            { label: "Select", tag: "RSelect", to: "/campos/select" },
            { label: "Switch", tag: "RSwitch", to: "/campos/switch" },
            { label: "Text", tag: "RText", to: "/campos/text" },
            { label: "Textarea", tag: "RTextarea", to: "/campos/textarea" }
        ]
    },
    {
        title: "Conceitos",
        items: [
            { label: "ui e Defaults", tag: "defaults", to: "/ui" },
            { label: "Tradução", tag: "tr", to: "/traducao" },
            { label: "Campos próprios", tag: "app/rform", to: "/customizados" }
        ]
    }
];