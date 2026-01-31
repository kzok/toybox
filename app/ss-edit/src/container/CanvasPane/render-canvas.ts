import type { EditorState, LineItem } from "./types";

/**
 * @param canvas
 * @param state
 */
export const renderCanvas = (canvas: HTMLCanvasElement, state: EditorState): void => {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderBackground(ctx, canvas.width, canvas.height);
  for (let i = state.items.length - 1; i >= 0; i -= 1) {
    const item = state.items[i]!;
    renderLine(ctx, item);
  }
};

const BACKGROUND = {
  /** background cell size px */
  SIZE: 10,
  /** background cell color */
  COLOR: "#ccc",
} as const;

/**
 * @param ctx
 * @param width
 * @param height
 */
const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  ctx.fillStyle = BACKGROUND.COLOR;
  ctx.lineWidth = 0;
  for (let x = 0; x <= Math.floor(width / BACKGROUND.SIZE); x += 1) {
    for (let y = 0; y <= Math.floor(height / BACKGROUND.SIZE); y += 1) {
      if ((x + y) % 2 === 0) {
        continue;
      }
      const startX = x * BACKGROUND.SIZE;
      const startY = y * BACKGROUND.SIZE;
      ctx.beginPath();
      ctx.fillRect(startX, startY, BACKGROUND.SIZE, BACKGROUND.SIZE);
    }
  }
};

/**
 * @param ctx
 * @param lineItem
 */
const renderLine = (ctx: CanvasRenderingContext2D, item: LineItem): void => {
  ctx.lineCap = "round";
  ctx.strokeStyle = item.color;
  ctx.lineWidth = item.width;
  ctx.beginPath();
  ctx.moveTo(item.head.x, item.head.y);
  ctx.lineTo(item.tail.x, item.tail.y);
  ctx.stroke();
};
