import type { Plot, Rect } from "./measure";

/** One knob for overall pace: every delay and duration below is stretched by this. 1 = as designed, >1 = slower. */
export const DEFAULT_TEMPO = 1.3;
export let TEMPO = DEFAULT_TEMPO;
export const setTempo = (tempo: number) => {
  TEMPO = tempo;
};

/** Drafting rhythm, in ms from when the layer mounts (before TEMPO). */
export const T = {
  /** Pre-stage: long construction lines and big blocks that set out the general shape. */
  guides: 0,
  guideSpread: 260,
  guideDraw: 420,
  blocks: 160,
  blockStep: 90,
  blockDraw: 400,
  frame: 90,
  frameDraw: 520,
  dims: 280,
  items: 280,
  itemStagger: 50,
  draw: 300,
  /** Sketch boxes: start offset either way, and how much their speed varies. */
  itemJitter: 260,
  /** An area's details start only once its box is completely down, plus a short random pause. */
  regionReady: 1,
  regionPause: 110,
  /** Within an area, details follow the hand top-left to bottom-right, this far apart. */
  detailStep: 26,
  shapeDraw: 280,
  pathDraw: 520,
  /** Hand variation in the detail pass: how far a stroke can start early or late, and how many lag well behind. */
  jitter: 300,
  lateChance: 0.14,
  late: 360,
  /** Beat between the last stroke landing and the UI fading in. */
  hold: 20,
  /** The UI fades in over this long (matches plot-reveal.css). */
  resolve: 460,
} as const;

/** Hi-fi rhythm: each element arrives this long (randomised) after its own detail lands. */
export const HIFI = {
  beat: 300,
  fade: 300,
  surface: 280,
  /** Pencil for an element clears over this long as its hi-fi version arrives. */
  clear: 240,
  /** Construction lines, labels and the frame clear over this long once the last element is in. */
  rest: 320,
} as const;

/** Seeded so the same UI always draws the same way (and renders are repeatable). */
const random = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Leader lines run out to a column this far right of the frame. */
export const ANNOTATION_GAP = 28;
const ANNOTATION_STEP = 17;

export type Stroke = { d: string; t: number; dur: number };
export type Block = Rect & { t: number; dur: number };

export type Schedule = {
  /** Pre-stage construction lines, running past the frame. */
  guides: Stroke[];
  /** Pre-stage blocks: one per major horizontal band of the layout. */
  blocks: Block[];
  itemAt: number[];
  itemDraw: number[];
  /** When each layout box's hatching clears: the detail pass reaching it. */
  hatchOut: number[];
  detailAt: number[];
  detailDraw: number[];
  /** Annotation row for each labelled item (by index), stacked so chips never overlap. */
  rows: Map<number, number>;
  /** Hi-fi, running alongside the drawing: the card surface, then each element shortly after its own detail lands. */
  surfaceAt: number;
  revealAt: number[];
  revealDur: number[];
  /** Per layout box: when its sketch clears, once everything inside it is real. */
  itemOut: number[];
  /** Construction lines and blocks each clear on their own beat while the card fills in. */
  guideOut: number[];
  blockOut: number[];
  /** The card outline, measurements and labels clear from here. */
  restAt: number;
  /** The drawing is complete (for `ready` waits). */
  drawnAt: number;
  end: number;
};

export const schedule = (plot: Plot): Schedule => {
  const count = Math.max(1, plot.items.length);
  const order = plot.items.map((it, i) => ({ i, key: Math.round(it.y / 8) * 10000 + it.x })).sort((a, b) => a.key - b.key);
  const rank = new Array<number>(count);
  order.forEach(({ i }, r) => (rank[i] = r));

  const rand = random(Math.round(plot.frame.w * 31 + plot.frame.h * 17 + plot.details.length * 7));
  const { w: W, h: H } = plot.frame;

  const isInside = (a: Rect, b: Rect) => a !== b && a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.w <= b.x + b.w + 1 && a.y + a.h <= b.y + b.h + 1;
  const top = plot.items.filter((a) => !plot.items.some((b) => isInside(a, b)));
  const left = Math.min(...plot.items.map((it) => it.x), W * 0.06);
  const right = Math.max(...plot.items.map((it) => it.x + it.w), W * 0.94);
  const bands: { y0: number; y1: number }[] = [];
  [...top]
    .sort((a, b) => a.y - b.y)
    .forEach((it) => {
      const last = bands.at(-1);
      if (last && it.y <= last.y1 + 10) last.y1 = Math.max(last.y1, it.y + it.h);
      else bands.push({ y0: it.y, y1: it.y + it.h });
    });
  const blocks: Block[] = bands.map((b, i) => ({
    x: left - 4,
    y: b.y0 - 4,
    w: right - left + 8,
    h: b.y1 - b.y0 + 8,
    t: T.blocks + i * T.blockStep + rand() * 120,
    dur: T.blockDraw * (0.7 + rand() * 0.6),
  }));

  const ext = 24;
  const uniq = (vals: number[]) => vals.sort((a, b) => a - b).filter((v, i, a) => i === 0 || v - a[i - 1] > 3);
  const cols = uniq([0, left, ...[1, 2, 3].map((k) => left + ((right - left) * k) / 4), right, W]);
  const rowsY = uniq([0, ...bands.flatMap((b) => [b.y0, b.y1]), H]);
  const guides: Stroke[] = [
    ...cols.map((x) => ({ d: `M${x.toFixed(1)} ${-ext} V${H + ext}`, t: 0, dur: 0 })),
    ...rowsY.map((y) => ({ d: `M${-ext} ${y.toFixed(1)} H${W + ext}`, t: 0, dur: 0 })),
  ].map((g) => ({ ...g, t: T.guides + rand() * T.guideSpread, dur: T.guideDraw * (0.7 + rand() * 0.6) }));

  const stagger = Math.min(T.itemStagger, Math.max(10, 1100 / count));
  const itemAt = plot.items.map((_, i) => Math.max(T.items, T.items + rank[i] * stagger + (rand() - 0.45) * T.itemJitter));
  const itemDraw = plot.items.map(() => T.draw * (0.6 + rand() * 0.8));
  const itemsEnd = plot.items.reduce<number>((m, _, i) => Math.max(m, itemAt[i] + itemDraw[i]), T.items);

  const ready = plot.items.map((_, i) => itemAt[i] + itemDraw[i] * T.regionReady + rand() * T.regionPause);
  const contains = (it: Rect, x: number, y: number) => x >= it.x - 2 && x <= it.x + it.w + 2 && y >= it.y - 2 && y <= it.y + it.h + 2;
  const regionReady = (x: number, y: number) => {
    let at = T.frame + T.frameDraw * T.regionReady;
    let nearest = -1;
    let best = Infinity;
    plot.items.forEach((it, i) => {
      if (contains(it, x, y)) at = Math.max(at, ready[i]);
      const dist = Math.abs(it.y + it.h / 2 - y) + Math.abs(it.x + it.w / 2 - x) * 0.25;
      if (dist < best) [best, nearest] = [dist, i];
    });
    return nearest >= 0 ? Math.max(at, ready[nearest] - 80) : at;
  };

  const order2 = plot.details.map((dt, i) => ({ i, key: Math.round(dt.y / 6) * 10000 + dt.x })).sort((a, b) => a.key - b.key);
  const localRank = new Array<number>(plot.details.length);
  const seen = new Map<number, number>();
  order2.forEach(({ i }) => {
    const dt = plot.details[i];
    const region = Math.round(regionReady(dt.x + 1, dt.y + 1));
    const n = seen.get(region) ?? 0;
    localRank[i] = n;
    seen.set(region, n + 1);
  });
  const detailAt = plot.details.map((dt, i) => {
    const lag = rand() < T.lateChance ? T.late * (0.6 + rand() * 0.8) : 0;
    return Math.max(T.frame + 200, regionReady(dt.x + 1, dt.y + 1) + localRank[i] * T.detailStep + (rand() - 0.4) * T.jitter + lag);
  });
  const detailDraw = plot.details.map((dt) => {
    const base = dt.kind === "path" ? T.pathDraw : dt.kind === "text" ? Math.min(420, 120 + dt.w * 1.4) : T.shapeDraw;
    return base * (0.6 + rand() * 0.7);
  });
  const hatchOut = plot.items.map((_, i) => ready[i] + 160);
  const looksDone = 0.6;
  const detailsEnd = detailAt.reduce<number>((m, t, i) => Math.max(m, t + detailDraw[i] * looksDone), itemsEnd * 0.9);

  const surfaceAt = T.frame + T.frameDraw * 0.6;
  const boxDone = (x: number, y: number) =>
    plot.items.reduce<number>((m, it, k) => (contains(it, x, y) ? Math.max(m, itemAt[k] + itemDraw[k]) : m), T.frame + T.frameDraw);
  const own = plot.details.map((dt, i) => Math.max(surfaceAt + HIFI.surface, boxDone(dt.x + 1, dt.y + 1), detailAt[i] + detailDraw[i]));
  const allDone = new Map<Element, number>();
  plot.details.forEach((dt, i) => allDone.set(dt.el, Math.max(allDone.get(dt.el) ?? 0, own[i])));
  const revealAt = plot.details.map((dt) => (allDone.get(dt.el) ?? 0) + HIFI.beat * (0.15 + rand() * 0.7));
  const revealDur = plot.details.map(() => HIFI.fade * (0.7 + rand() * 0.6));
  const itemOut = plot.items.map((it, i) => {
    let last = -1;
    plot.details.forEach((dt, k) => {
      if (contains(it, dt.x + 1, dt.y + 1)) last = Math.max(last, revealAt[k]);
    });
    return last >= 0 ? last + 40 : itemAt[i] + itemDraw[i] + HIFI.beat * (0.5 + rand());
  });
  const lastReveal = revealAt.reduce<number>((m, t, i) => Math.max(m, t + revealDur[i] * 0.6), surfaceAt);
  const sorted = [...revealAt].sort((a, b) => a - b);
  const midway = sorted[Math.floor(sorted.length * 0.5)] ?? surfaceAt;
  const restAt = Math.max(midway, lastReveal - HIFI.rest * 0.5);
  const guideOut = guides.map(() => midway + rand() * (restAt - midway));
  const blockOut = blocks.map(() => midway + rand() * (restAt - midway));

  const rows = new Map<number, number>();
  let floor = -Infinity;
  plot.items
    .map((it, i) => ({ i, cy: it.y + it.h / 2, label: it.label }))
    .filter((a) => a.label)
    .sort((a, b) => a.cy - b.cy)
    .forEach(({ i, cy }) => {
      const y = Math.max(cy, floor + ANNOTATION_STEP);
      rows.set(i, y);
      floor = y;
    });

  return {
    guides,
    blocks,
    itemAt,
    itemDraw,
    hatchOut,
    detailAt,
    detailDraw,
    rows,
    surfaceAt,
    revealAt,
    revealDur,
    itemOut,
    guideOut,
    blockOut,
    restAt,
    drawnAt: Math.max(detailsEnd, T.frame + T.frameDraw),
    end: Math.max(restAt + HIFI.rest + 260, lastReveal, ...itemOut.map((t) => t + 520)),
  };
};
