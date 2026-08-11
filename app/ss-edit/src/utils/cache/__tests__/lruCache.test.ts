import { describe, expect, it, vi } from "vitest";
import { LruCache } from "../lruCache";

describe("LruCache", () => {
  describe("constructor", () => {
    it("rejects a capacity that is not a positive number.", () => {
      expect(() => new LruCache<string, string>(0)).toThrow(RangeError);
      expect(() => new LruCache<string, string>(-1)).toThrow(RangeError);
      // NOTE: NaN passes `<= 0`, hence it would silently disable the eviction altogether.
      expect(() => new LruCache<string, string>(Number.NaN)).toThrow(RangeError);
    });
  });

  describe("get()", () => {
    it("returns undefined for a key that was never set.", () => {
      const cache = new LruCache<string, string>(2);
      expect(cache.get("a")).toBeUndefined();
    });

    it("returns the value that was set.", () => {
      const cache = new LruCache<string, string>(2);
      cache.set("a", "A");
      expect(cache.get("a")).toBe("A");
    });
  });

  describe("set()", () => {
    it("overwrites the value of an existing key.", () => {
      const cache = new LruCache<string, string>(2);
      cache.set("a", "A");
      cache.set("a", "A2");
      cache.set("b", "B");
      // the overwrite must not have taken a slot of its own.
      expect(cache.get("a")).toBe("A2");
      expect(cache.get("b")).toBe("B");
    });

    it("evicts the oldest entry once the capacity is exceeded.", () => {
      const cache = new LruCache<string, string>(2);
      cache.set("a", "A");
      cache.set("b", "B");
      cache.set("c", "C");
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe("B");
      expect(cache.get("c")).toBe("C");
    });

    it("evicts a falsy key as it would any other.", () => {
      const cache = new LruCache<string, string>(2);
      cache.set("", "EMPTY");
      cache.set("b", "B");
      cache.set("c", "C");
      expect(cache.get("")).toBeUndefined();
      expect(cache.get("b")).toBe("B");
      expect(cache.get("c")).toBe("C");
    });

    it("holds a single entry when the capacity is one.", () => {
      const cache = new LruCache<string, string>(1);
      cache.set("a", "A");
      cache.set("b", "B");
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe("B");
    });
  });

  describe("getOrCompute()", () => {
    it("returns the cached value without calling the callback.", () => {
      const cache = new LruCache<string, string>(2);
      cache.set("a", "A");
      const compute = vi.fn(() => "COMPUTED");
      expect(cache.getOrCompute("a", compute)).toBe("A");
      expect(compute).not.toHaveBeenCalled();
    });

    it("calls the callback once on a miss and stores what it returned.", () => {
      const cache = new LruCache<string, string>(2);
      const compute = vi.fn(() => "A");
      expect(cache.getOrCompute("a", compute)).toBe("A");
      expect(cache.getOrCompute("a", compute)).toBe("A");
      expect(compute).toHaveBeenCalledTimes(1);
      expect(cache.get("a")).toBe("A");
    });

    it("counts a stored null as a hit.", () => {
      const cache = new LruCache<string, string | null>(2);
      cache.set("a", null);
      const compute = vi.fn(() => "A");
      expect(cache.getOrCompute("a", compute)).toBeNull();
      expect(compute).not.toHaveBeenCalled();
    });
  });

  describe("recency", () => {
    it("spares an entry that get() has read from the next eviction.", () => {
      const cache = new LruCache<string, string>(2);
      cache.set("a", "A");
      cache.set("b", "B");
      // reading "a" makes it the most recent, hence "b" is the one to go.
      expect(cache.get("a")).toBe("A");
      cache.set("c", "C");
      expect(cache.get("a")).toBe("A");
      expect(cache.get("b")).toBeUndefined();
    });

    it("spares an entry that set() has overwritten from the next eviction.", () => {
      const cache = new LruCache<string, string>(2);
      cache.set("a", "A");
      cache.set("b", "B");
      cache.set("a", "A2");
      cache.set("c", "C");
      expect(cache.get("a")).toBe("A2");
      expect(cache.get("b")).toBeUndefined();
    });

    it("spares an entry that getOrCompute() has read from the next eviction.", () => {
      const cache = new LruCache<string, string>(2);
      cache.set("a", "A");
      cache.set("b", "B");
      expect(cache.getOrCompute("a", () => "COMPUTED")).toBe("A");
      cache.set("c", "C");
      expect(cache.get("a")).toBe("A");
      expect(cache.get("b")).toBeUndefined();
    });

    it("counts reading a nullish value as a use.", () => {
      const cache = new LruCache<string, string | null>(2);
      cache.set("a", null);
      cache.set("b", "B");
      // NOTE: a stored null is a hit rather than a miss, hence it refreshes the recency as any
      //   other value does. telling the two apart is what `undefined` is left to mean.
      expect(cache.get("a")).toBeNull();
      cache.set("c", "C");
      expect(cache.get("a")).toBeNull();
      expect(cache.get("b")).toBeUndefined();
    });
  });
});
