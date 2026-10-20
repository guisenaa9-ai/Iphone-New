import { describe, expect, it } from "vitest";
import { phoneSpec } from "@/lib/phone-spec";

describe("phoneSpec", () => {
  it.each([
    ["iPhone 16 Pro Max", { cameras: "triple", front: "island", big: true }],
    ["iPhone 16 Pro", { cameras: "triple", front: "island", big: false }],
    ["iPhone 16 Plus", { cameras: "vertical", front: "island", big: true }],
    ["iPhone 16", { cameras: "vertical", front: "island", big: false }],
    ["iPhone 16e", { cameras: "single", front: "notch", big: false }],
    ["iPhone 15", { cameras: "diagonal", front: "island", big: false }],
    ["iPhone 15 Pro", { cameras: "triple", front: "island", big: false }],
    ["iPhone 14 Pro", { cameras: "triple", front: "island", big: false }],
    ["iPhone 14", { cameras: "diagonal", front: "notch", big: false }],
    ["iPhone 13", { cameras: "diagonal", front: "notch", big: false }],
    ["iPhone 12", { cameras: "vertical", front: "notch", big: false }],
    ["iPhone SE", { cameras: "single", front: "home", big: false }],
  ])("%s", (name, spec) => expect(phoneSpec(name)).toEqual(spec));
});
