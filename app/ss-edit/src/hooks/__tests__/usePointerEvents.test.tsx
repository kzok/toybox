import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vitest } from "vitest";
import { usePointerEvents } from "../usePointerEvents";

const noop = (): void => {};

describe(usePointerEvents, () => {
  type TargetParams = Parameters<typeof usePointerEvents>[0];
  const TestComponent: React.FC<{ params: TargetParams }> = (props) => (
    <button type="button" {...usePointerEvents(props.params)}>
      example button
    </button>
  );

  describe("handling click", () => {
    it("call onClick().", async () => {
      const onClick = vitest.fn(noop);
      render(<TestComponent params={{ onClick }} />);

      await userEvent.click(await screen.findByRole("button"));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("handling drag", () => {
    describe("with pointer move", () => {
      it("call not onClick but onPointerDown and onPointerMove.", async () => {
        const onPointerDown = vitest.fn(noop);
        const onPointerMove = vitest.fn(noop);
        const onClick = vitest.fn(noop);
        render(<TestComponent params={{ onClick, onPointerDown, onPointerMove }} />);

        const target = await screen.findByRole("button");
        await userEvent.pointer([
          { target, keys: "[MouseLeft>]" },
          { target, coords: { offsetX: 10, offsetY: 10 } },
          { target, keys: "[/MouseLeft]" },
        ]);
        expect(onPointerDown).toHaveBeenCalled();
        expect(onPointerMove).toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
      });
    });

    describe("without pointer move", () => {
      it("call not onPointerMove but onPointerDown and onClick.", async () => {
        const onPointerDown = vitest.fn(noop);
        const onPointerMove = vitest.fn(noop);
        const onClick = vitest.fn(noop);
        render(<TestComponent params={{ onClick, onPointerDown, onPointerMove }} />);

        const target = await screen.findByRole("button");
        await userEvent.pointer([
          { target, keys: "[MouseLeft>]" },
          { target, keys: "[/MouseLeft]" },
        ]);
        expect(onPointerDown).toHaveBeenCalled();
        expect(onPointerMove).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalled();
      });
    });
  });

  describe("preventDefault option", () => {
    describe("as default", () => {
      it("not call e.preventDefault().", async () => {
        const sharedHandler: React.EventHandler<React.SyntheticEvent> = (e) => {
          expect(e.isDefaultPrevented()).toBe(false);
          expect(e.isPropagationStopped()).toBe(false);
        };
        const onClick = vitest.fn(sharedHandler);
        render(<TestComponent params={{ onClick }} />);

        await userEvent.click(await screen.findByRole("button"));
        expect(onClick).toHaveBeenCalled();
      });
    });

    describe("when set to true", () => {
      it("call e.preventDefault().", async () => {
        const sharedHandler: React.EventHandler<React.SyntheticEvent> = (e) => {
          expect(e.isDefaultPrevented()).toBe(true);
          expect(e.isPropagationStopped()).toBe(true);
        };
        const onClick = vitest.fn(sharedHandler);
        render(<TestComponent params={{ preventDefault: true, onClick }} />);

        await userEvent.click(await screen.findByRole("button"));
        expect(onClick).toHaveBeenCalled();
      });
    });
  });
});
