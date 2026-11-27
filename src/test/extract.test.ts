import { describe, expect, it } from "vitest";
import { extractReport } from "../lib/reports";

describe("extractReport", () => {
  it("finds machine number and maintenance category", () => {
    const r = extractReport("Machine 12 is making noise");
    expect(r.machine).toBe("M-12");
    expect(r.category).toBe("Maintenance");
    expect(r.urgency).toBe("Medium");
  });
  it("detects quality issues", () => {
    expect(extractReport("Products from line L-3 are damaged").category).toBe("Quality");
  });
  it("marks stopped machines as high urgency", () => {
    expect(extractReport("CNC-4 stopped working").urgency).toBe("High");
  });
  it("marks smoke as critical", () => {
    expect(extractReport("smoke coming from press 5").urgency).toBe("Critical");
  });
});
