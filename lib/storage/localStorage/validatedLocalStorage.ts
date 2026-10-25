import { atom, type PrimitiveAtom } from "jotai";
import type { ZodType } from "zod";

type JsonSerializable = { [_: string]: string | number | null | JsonSerializable };

/** local storage adaptor validated with a Zod schema. */
export class ValidatedLocalStorage<T extends JsonSerializable> {
  /**
   * @param key local storage key
   * @param schema Zod schema of the stored value.
   *   every field is optional, so that a value stored before `T` gained a field keeps its other fields.
   * @param fallback default value, which also fills the fields that the stored value lacks
   */
  constructor(
    public readonly key: string,
    public readonly schema: ZodType<{ [K in keyof T]?: T[K] | undefined }>,
    public readonly fallback: Readonly<T>,
  ) {}
  /**
   * @returns loaded and validated local storage value.
   */
  load(): T {
    const result = Object.assign({}, this.fallback);
    try {
      const text = window.localStorage.getItem(this.key);
      if (text == null) return result;
      Object.assign(result, this.schema.parse(JSON.parse(text)));
      return result;
    } catch {
      return result;
    }
  }
  /**
   * @param next next value
   */
  save(next: T): void {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(next));
    } catch {
      // a storage that refuses the write leaves the value unsaved rather than failing the caller.
    }
  }
  /**
   * @returns jotai atom bound with local storage.
   */
  toJotaiAtom(): PrimitiveAtom<T> {
    const primitive = atom(this.load());
    return atom(
      (get) => get(primitive),
      (get, set, value) => {
        if (typeof value === "function") {
          value = value(get(primitive));
        }
        set(primitive, value);
        this.save(value);
      },
    );
  }
}
