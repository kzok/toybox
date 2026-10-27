import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  // clean up rendered content.
  cleanup();
  // restore all mocked functions after each test case.
  vi.restoreAllMocks();
  // clear what a test stored, so that the next test starts from an empty storage.
  localStorage.clear();
});
