import { createStore } from "jotai";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ValidatedLocalStorage } from "../validatedLocalStorage";

type Settings = { size: number; label: string };

const KEY = "test:settings";
const schema = z.object({ size: z.number(), label: z.string() }).partial();
const fallback: Settings = { size: 0, label: "none" };

const createTarget = () => new ValidatedLocalStorage<Settings>(KEY, schema, fallback);

describe(ValidatedLocalStorage, () => {
  describe("load()", () => {
    it("returns the stored value that fits the schema.", () => {
      localStorage.setItem(KEY, JSON.stringify({ size: 8, label: "large" }));
      expect(createTarget().load()).toStrictEqual({ size: 8, label: "large" });
    });

    it("fills the fields that the stored value lacks from the fallback.", () => {
      // a value stored before `label` was added to the settings.
      localStorage.setItem(KEY, JSON.stringify({ size: 8 }));
      expect(createTarget().load()).toStrictEqual({ size: 8, label: "none" });
    });

    it("returns the fallback when nothing is stored.", () => {
      expect(createTarget().load()).toStrictEqual(fallback);
    });

    it("returns the fallback for a value that is not JSON.", () => {
      localStorage.setItem(KEY, "{size:");
      expect(createTarget().load()).toStrictEqual(fallback);
    });

    it("returns the fallback for a value that does not fit the schema.", () => {
      localStorage.setItem(KEY, JSON.stringify({ size: "8", label: "large" }));
      expect(createTarget().load()).toStrictEqual(fallback);
    });

    it("returns the fallback when the storage throws.", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });
      expect(createTarget().load()).toStrictEqual(fallback);
    });

    it("returns a copy, so that a change to it leaves the fallback as it is.", () => {
      const loaded = createTarget().load();
      loaded.size = 100;
      expect(fallback).toStrictEqual({ size: 0, label: "none" });
    });
  });

  describe("save()", () => {
    it("stores a value that load() reads back.", () => {
      const storage = createTarget();
      storage.save({ size: 8, label: "large" });
      expect(storage.load()).toStrictEqual({ size: 8, label: "large" });
    });

    it("does not throw when the storage throws.", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });
      expect(() => createTarget().save({ size: 8, label: "large" })).not.toThrow();
    });
  });

  describe("toJotaiAtom()", () => {
    it("starts from the stored value.", () => {
      localStorage.setItem(KEY, JSON.stringify({ size: 8, label: "large" }));
      const store = createStore();
      expect(store.get(createTarget().toJotaiAtom())).toStrictEqual({ size: 8, label: "large" });
    });

    it("saves every value that it is set to.", () => {
      const store = createStore();
      store.set(createTarget().toJotaiAtom(), { size: 8, label: "large" });
      expect(createTarget().load()).toStrictEqual({ size: 8, label: "large" });
    });

    it("resolves an updater against its own value, which a failed save leaves ahead of the stored one.", () => {
      const store = createStore();
      const target = createTarget().toJotaiAtom();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

      store.set(target, { size: 8, label: "large" });
      store.set(target, (prev) => ({ ...prev, label: "small" }));

      expect(store.get(target)).toStrictEqual({ size: 8, label: "small" });
    });
  });
});
