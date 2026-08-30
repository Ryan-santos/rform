// @vitest-environment nuxt
import { describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { h, nextTick, ref } from "vue";
import { RPin } from "#components";

const mountPin = async (props: Record<string, unknown> = {}) => {
    const model = ref<string>((props.modelValue as string) ?? "");

    const wrapper = await mountSuspended({
        setup: () => () => h(RPin, {
            ...props,
            modelValue: model.value,
            "onUpdate:modelValue": (value: string) => {
                model.value = value;
            }
        })
    }, { attachTo: document.body });

    return {
        wrapper,
        model,
        boxes: () => wrapper.findAll("input")
    };
};

describe("RPin", () => {
    it("renders six boxes by default", async () => {
        const wrapper = await mountSuspended(RPin);
        expect(wrapper.findAll("input")).toHaveLength(6);
    });

    it("renders the number of boxes given by length", async () => {
        const { boxes } = await mountPin({ length: 4 });
        expect(boxes()).toHaveLength(4);
    });

    it("spreads the model across the boxes", async () => {
        const { boxes } = await mountPin({ modelValue: "123" });

        expect(boxes().map(box => box.element.value)).toEqual(["1", "2", "3", "", "", ""]);
    });

    it("writes a typed character into the model", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.setValue("7");

        expect(model.value).toBe("7");
    });

    it("moves focus to the next box after typing", async () => {
        const { boxes } = await mountPin();

        await boxes()[0]!.setValue("7");

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });
});

describe("RPin charset", () => {
    it("marks numeric boxes with a numeric inputmode", async () => {
        const { boxes } = await mountPin();
        expect(boxes()[0]!.attributes("inputmode")).toBe("numeric");
    });

    it("ignores a letter when the charset is numeric", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.setValue("a");

        expect(model.value).toBe("");
    });

    it("keeps focus on the box when the character is rejected", async () => {
        const { boxes } = await mountPin();

        boxes()[0]!.element.focus();
        await boxes()[0]!.setValue("a");

        expect(document.activeElement).toBe(boxes()[0]!.element);
    });

    it("uppercases letters when the charset is alphanumeric", async () => {
        const { boxes, model } = await mountPin({ type: "alphanumeric" });

        await boxes()[0]!.setValue("a");

        expect(model.value).toBe("A");
    });

    it("ignores punctuation when the charset is alphanumeric", async () => {
        const { boxes, model } = await mountPin({ type: "alphanumeric" });

        await boxes()[0]!.setValue("-");

        expect(model.value).toBe("");
    });

    it("marks alphanumeric boxes with a text inputmode", async () => {
        const { boxes } = await mountPin({ type: "alphanumeric" });
        expect(boxes()[0]!.attributes("inputmode")).toBe("text");
    });
});

describe("RPin keyboard", () => {
    it("removes the character of the focused box on backspace", async () => {
        const { boxes, model } = await mountPin({ modelValue: "12" });

        await boxes()[1]!.trigger("keydown", { key: "Backspace" });

        expect(model.value).toBe("1");
    });

    it("keeps focus in place when backspacing a filled box", async () => {
        const { boxes } = await mountPin({ modelValue: "12" });

        boxes()[1]!.element.focus();
        await boxes()[1]!.trigger("keydown", { key: "Backspace" });

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });

    it("clears the previous box when backspacing an empty one", async () => {
        const { boxes, model } = await mountPin({ modelValue: "12" });

        await boxes()[2]!.trigger("keydown", { key: "Backspace" });

        expect(model.value).toBe("1");
    });

    it("moves focus back when backspacing an empty box", async () => {
        const { boxes } = await mountPin({ modelValue: "12" });

        await boxes()[2]!.trigger("keydown", { key: "Backspace" });

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });

    it("moves focus with the left arrow", async () => {
        const { boxes } = await mountPin({ modelValue: "123" });

        await boxes()[2]!.trigger("keydown", { key: "ArrowLeft" });

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });

    it("moves focus with the right arrow", async () => {
        const { boxes } = await mountPin({ modelValue: "123" });

        await boxes()[0]!.trigger("keydown", { key: "ArrowRight" });

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });

    it("redirects focus to the first empty box, so the value never has a gap", async () => {
        const { boxes } = await mountPin({ modelValue: "12" });

        boxes()[4]!.element.focus();
        await nextTick();

        expect(document.activeElement).toBe(boxes()[2]!.element);
    });

    it("leaves focus alone on a box inside the value", async () => {
        const { boxes } = await mountPin({ modelValue: "123" });

        boxes()[1]!.element.focus();
        await nextTick();

        expect(document.activeElement).toBe(boxes()[1]!.element);
    });
});

describe("RPin paste", () => {
    it("keeps both characters when two are typed in the same tick", async () => {
        const { boxes, model } = await mountPin();

        void boxes()[0]!.setValue("1");
        void boxes()[1]!.setValue("2");
        await nextTick();

        expect(model.value).toBe("12");
    });

    it("distributes a pasted code across the boxes", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.trigger("paste", {
            clipboardData: { getData: () => "123456" }
        });

        expect(model.value).toBe("123456");
    });

    it("drops pasted characters outside the charset", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.trigger("paste", {
            clipboardData: { getData: () => "12ab34" }
        });

        expect(model.value).toBe("1234");
    });

    it("caps a pasted value at length", async () => {
        const { boxes, model } = await mountPin();

        await boxes()[0]!.trigger("paste", {
            clipboardData: { getData: () => "1234567890" }
        });

        expect(model.value).toBe("123456");
    });

    it("focuses the box after the pasted value", async () => {
        const { boxes } = await mountPin();

        await boxes()[0]!.trigger("paste", {
            clipboardData: { getData: () => "123" }
        });

        expect(document.activeElement).toBe(boxes()[3]!.element);
    });
});

describe("RPin secret", () => {
    it("renders plain boxes by default", async () => {
        const { boxes } = await mountPin();
        expect(boxes()[0]!.attributes("type")).toBe("text");
    });

    it("renders password boxes when secret", async () => {
        const { boxes } = await mountPin({ secret: true });
        expect(boxes()[0]!.attributes("type")).toBe("password");
    });
});

describe("RPin autofocus", () => {
    it("does not steal focus by default", async () => {
        const { boxes } = await mountPin();
        expect(document.activeElement).not.toBe(boxes()[0]!.element);
    });

    it("focuses the first box on mount", async () => {
        const { boxes } = await mountPin({ autofocus: true });
        expect(document.activeElement).toBe(boxes()[0]!.element);
    });

    it("focuses the first empty box on mount", async () => {
        const { boxes } = await mountPin({ autofocus: true, modelValue: "12" });
        expect(document.activeElement).toBe(boxes()[2]!.element);
    });
});

describe("RPin separator", () => {
    it("renders no separator by default", async () => {
        const { wrapper } = await mountPin();
        expect(wrapper.findAll("[aria-hidden='true']")).toHaveLength(0);
    });

    it("renders a separator every N boxes", async () => {
        const { wrapper } = await mountPin({ separator: 2 });
        expect(wrapper.findAll("[aria-hidden='true']")).toHaveLength(2);
    });

    it("does not render a separator after the last box", async () => {
        const { wrapper } = await mountPin({ length: 6, separator: 3 });
        expect(wrapper.findAll("[aria-hidden='true']")).toHaveLength(1);
    });
});

describe("RPin completion", () => {
    it("calls onComplete with the full value", async () => {
        const onComplete = vi.fn();
        const { boxes } = await mountPin({ length: 3, onComplete });

        await boxes()[0]!.trigger("paste", { clipboardData: { getData: () => "123" } });

        expect(onComplete).toHaveBeenCalledWith("123");
    });

    it("does not call onComplete while the value is incomplete", async () => {
        const onComplete = vi.fn();
        const { boxes } = await mountPin({ length: 3, onComplete });

        await boxes()[0]!.trigger("paste", { clipboardData: { getData: () => "12" } });

        expect(onComplete).not.toHaveBeenCalled();
    });

    it("does not call onComplete again while the value stays full", async () => {
        const onComplete = vi.fn();
        const { boxes } = await mountPin({ length: 3, onComplete });

        await boxes()[0]!.trigger("paste", { clipboardData: { getData: () => "123" } });
        await boxes()[0]!.setValue("9");

        expect(onComplete).toHaveBeenCalledTimes(1);
    });
});
