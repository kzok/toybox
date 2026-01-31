// import {EditorState} from "./types";

/**
 * @param canvas
 * @param state
 */
export const renderCanvas = (
  canvas: HTMLCanvasElement,
  // _state: EditorState,
): void => {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderBackground(ctx, canvas.width, canvas.height);
  // ctx.beginPath();
  // ctx.strokeStyle = "pink";
  // ctx.lineWidth = 5;
  // ctx.moveTo(100, 100);
  // ctx.lineTo(400, 400);
  // ctx.stroke();
};

/**
 * @param ctx
 * @param width
 * @param height
 */
const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  for (let x = 0; x <= Math.floor(width / BACKGROUND.SIZE); x += 1) {
    for (let y = 0; y <= Math.floor(height / BACKGROUND.SIZE); y += 1) {
      if ((x + y) % 2 === 0) {
        continue;
      }
      const startX = x * BACKGROUND.SIZE;
      const startY = y * BACKGROUND.SIZE;
      ctx.fillStyle = BACKGROUND.COLOR;
      ctx.beginPath();
      ctx.fillRect(startX, startY, BACKGROUND.SIZE, BACKGROUND.SIZE);
    }
  }
};

const BACKGROUND = {
  /** background cell size px */
  SIZE: 10,
  /** background cell color */
  COLOR: "#ccc",
} as const;
