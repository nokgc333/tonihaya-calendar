import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "../../src/app/structuredData";

describe("the structured data", () => {
  it("is serialized so that it can never close the script tag it is placed in", () => {
    const text = serializeJsonLd({
      a: "</script><script>alert(1)</script>",
      b: "<!--",
    });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({
      a: "</script><script>alert(1)</script>",
      b: "<!--",
    });
  });

  it("is valid JSON when serialized", () => {
    expect(JSON.parse(serializeJsonLd({ name: "calendar" }))).toEqual({
      name: "calendar",
    });
  });
});
