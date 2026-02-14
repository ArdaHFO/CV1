declare module 'canvas-confetti' {
  export interface GlobalOptions {
    resize?: boolean;
    useWorker?: boolean;
    [key: string]: unknown;
  }

  export interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    scalar?: number;
    zIndex?: number;
    shapes?: string[] | unknown[];
    [key: string]: unknown;
  }

  export type CreateTypes = (options?: Options) => Promise<null> | null;

  export interface ShapeFromPathOptions {
    path: string;
    matrix?: number[];
  }

  export interface ShapeFromTextOptions {
    text: string;
    scalar?: number;
    color?: string;
  }

  interface ConfettiFn {
    (options?: Options): Promise<null> | null;
    create(canvas: HTMLCanvasElement, options?: GlobalOptions): CreateTypes & { reset: () => void };
    shapeFromPath(options: ShapeFromPathOptions): unknown;
    shapeFromText(options: ShapeFromTextOptions): unknown;
    reset(): void;
  }

  const confetti: ConfettiFn;
  export default confetti;
}
