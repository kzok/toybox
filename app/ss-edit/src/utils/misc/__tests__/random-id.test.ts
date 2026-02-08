import { describe, expect, it } from "vitest";
import { randomId } from "../random-id";

describe(randomId, () => {
  it("generates an unique ID.", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      const id = randomId();
      expect(set).not.toContain(id);
      set.add(id);
    }
  });
});
