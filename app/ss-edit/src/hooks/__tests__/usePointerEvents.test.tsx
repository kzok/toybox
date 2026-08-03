import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import React from "react";
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
          { target, keys: "[MouseLeft>]", coords: { clientX: 0, clientY: 0 } },
          { target, coords: { clientX: 100, clientY: 100 } },
          { target, keys: "[/MouseLeft]" },
        ]);
        expect(onPointerDown).toHaveBeenCalled();
        expect(onPointerMove).toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
      });

      it("swallow the click so that ancestors don't handle it.", async () => {
        const ancestorOnClick = vitest.fn(noop);
        render(
          <div onClick={ancestorOnClick}>
            <TestComponent params={{}} />
          </div>,
        );

        const target = await screen.findByRole("button");
        await userEvent.pointer([
          { target, keys: "[MouseLeft>]", coords: { clientX: 0, clientY: 0 } },
          { target, coords: { clientX: 100, clientY: 100 } },
          { target, keys: "[/MouseLeft]" },
        ]);
        expect(ancestorOnClick).not.toHaveBeenCalled();
      });

      it("keep working when the component re-renders mid-drag.", async () => {
        const onClick = vitest.fn(noop);
        // params is intentionally not memoized, and a state update re-renders
        // during the drag, just like actions.moveItem() does in SelectMode.
        const Rerendering: React.FC = () => {
          const [, setTick] = React.useState(0);
          return (
            <button
              type="button"
              {...usePointerEvents({
                onPointerMove: () => {
                  setTick((n) => n + 1);
                },
                onClick,
              })}
            >
              example button
            </button>
          );
        };
        render(<Rerendering />);

        const target = await screen.findByRole("button");
        await userEvent.pointer([
          { target, keys: "[MouseLeft>]", coords: { clientX: 0, clientY: 0 } },
          { target, coords: { clientX: 100, clientY: 100 } },
          { target, keys: "[/MouseLeft]" },
        ]);
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

      it("let the click reach ancestors.", async () => {
        const ancestorOnClick = vitest.fn(noop);
        render(
          <div onClick={ancestorOnClick}>
            <TestComponent params={{}} />
          </div>,
        );

        await userEvent.click(await screen.findByRole("button"));
        expect(ancestorOnClick).toHaveBeenCalled();
      });
    });
  });
});
