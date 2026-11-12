/**
 * Draws one frame of the product video on a 720×1280 canvas:
 *   background → soft elliptical contact shadow → product cut-out → light sweep → film grain.
 * The colour grade is baked into cached background/product layers (background graded more
 * strongly than the product), so each frame is only a few drawImage calls (phone friendly).
 */
import { LAYOUT, VIDEO } from '../shared/config.js';
import { gradeFilter, gradeKey, temperatureTint } from './grade.js';
import { motionAt, sweepAt } from './motion.js';

const W = VIDEO.width;
const H = VIDEO.height;

const makeCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/** Draws `src` into `ctx` with the grade at `strength`, preserving transparency. */
function drawGraded(ctx, src, x, y, w, h, grade, strength) {
  ctx.save();
  if ('filter' in ctx) ctx.filter = gradeFilter(grade, strength);
  ctx.drawImage(src, x, y, w, h);
  ctx.restore();
  const tint = temperatureTint(grade, strength);
  if (tint) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = tint.alpha;
    ctx.fillStyle = tint.color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    // soft-light paints transparent pixels too; re-cut to the source's alpha.
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(src, x, y, w, h);
    ctx.restore();
  }
}

/** Pre-rendered noise tiles for film grain. */
function makeGrainTiles(n = 4, size = 160) {
  return Array.from({ length: n }, () => {
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  });
}

export class Compositor {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    canvas.width = W;
    canvas.height = H;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.background = null; // HTMLImageElement | ImageBitmap
    this.product = null; // canvas/ImageBitmap with transparency
    this.brief = null;
    this._bgLayer = null;
    this._bgKey = '';
    this._productLayer = null;
    this._productKey = '';
    this._sweep = null;
    this._grain = makeGrainTiles().map((t) => this.ctx.createPattern(t, 'repeat'));
    this._frame = 0;
  }

  /** @param {CanvasImageSource} img */
  setBackground(img) {
    this.background = img;
    this._bgKey = '';
  }

  /** @param {CanvasImageSource & {width:number, height:number}} img  transparent cut-out (or framed photo) */
  setProduct(img) {
    this.product = img;
    this._productKey = '';
  }

  /** @param {object} brief  see src/shared/briefSchema.js */
  setBrief(brief) {
    this.brief = brief;
  }

  /** Product draw size at scale 1, fitted to ~55% of the frame height. */
  productSize() {
    const a = this.product.width / this.product.height;
    let h = H * LAYOUT.productHeight;
    let w = h * a;
    if (w > W * LAYOUT.productMaxWidth) {
      w = W * LAYOUT.productMaxWidth;
      h = w / a;
    }
    return { w, h };
  }

  _ensureBgLayer() {
    const key = gradeKey(this.brief.grade, LAYOUT.bgGradeStrength);
    if (this._bgLayer && this._bgKey === key) return;
    const bw = W * LAYOUT.bgOversize;
    const bh = H * LAYOUT.bgOversize;
    const layer = this._bgLayer ?? makeCanvas(bw, bh);
    const g = layer.getContext('2d');
    g.clearRect(0, 0, bw, bh);
    // Cover-fit the source image.
    const iw = this.background.width || bw;
    const ih = this.background.height || bh;
    const s = Math.max(bw / iw, bh / ih);
    drawGraded(g, this.background, (bw - iw * s) / 2, (bh - ih * s) / 2, iw * s, ih * s, this.brief.grade, LAYOUT.bgGradeStrength);
    this._bgLayer = layer;
    this._bgKey = key;
  }

  _ensureProductLayer() {
    const key = gradeKey(this.brief.grade, LAYOUT.productGradeStrength);
    if (this._productLayer && this._productKey === key) return;
    // Render at 1.25× the on-screen size so push-ins stay sharp.
    const { w, h } = this.productSize();
    const pw = w * 1.25;
    const ph = h * 1.25;
    const layer = makeCanvas(pw, ph);
    drawGraded(layer.getContext('2d'), this.product, 0, 0, layer.width, layer.height, this.brief.grade, LAYOUT.productGradeStrength);
    this._productLayer = layer;
    this._sweep = makeCanvas(layer.width, layer.height);
    this._productKey = key;
  }

  /** Product layer with the diagonal light band at position s (0..1). */
  _sweepLayer(s) {
    const src = this._productLayer;
    const c = this._sweep;
    const g = c.getContext('2d');
    const { width: w, height: h } = c;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, w, h);
    g.drawImage(src, 0, 0);
    // Band travels from top-left to bottom-right, only on the product's pixels.
    // Position along the top-left → bottom-right diagonal; starts/ends off the product.
    const pos = -0.25 + s * 1.5;
    const half = 0.14;
    const band = g.createLinearGradient((pos - half) * w, (pos - half) * h, (pos + half) * w, (pos + half) * h);
    band.addColorStop(0, 'rgba(255,255,255,0)');
    band.addColorStop(0.5, 'rgba(255,255,255,0.42)');
    band.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = band;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    return c;
  }

  /**
   * Draws the frame at linear progress p (0..1) through the clip.
   * @param {number} p
   */
  render(p) {
    const ctx = this.ctx;
    const brief = this.brief;
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, W, H);
    if (!brief || !this.background) return;

    const m = motionAt(brief, p);
    const size = this.product ? this.productSize() : { w: 0, h: H * LAYOUT.productHeight };
    // Zoom anchor = centre of the product, so push-ins move toward it.
    const ax = W / 2;
    const ay = H * LAYOUT.baseY - size.h / 2;

    // 1. Background (oversized, parallax at 0.6× the product's motion).
    this._ensureBgLayer();
    const bw = this._bgLayer.width;
    const bh = this._bgLayer.height;
    ctx.save();
    ctx.translate(ax + m.bg.x, ay + m.bg.y);
    ctx.scale(m.bg.scale, m.bg.scale);
    ctx.drawImage(this._bgLayer, W / 2 - ax - bw / 2, H / 2 - ay - bh / 2);
    ctx.restore();

    if (this.product) {
      this._ensureProductLayer();
      const { w, h } = size;
      const sx = m.product.scale * m.product.squash;
      const sy = m.product.scale;
      const px = ax + m.product.x;
      const baseY = ay + (h / 2) * sy;

      // 2. Soft elliptical contact shadow under the product's base.
      const rx = w * 0.46 * sx;
      const ry = Math.max(8, rx * 0.12);
      ctx.save();
      ctx.translate(px, baseY - ry * 0.25);
      ctx.scale(1, ry / rx);
      const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      shadow.addColorStop(0, 'rgba(0,0,0,0.5)');
      shadow.addColorStop(0.55, 'rgba(0,0,0,0.22)');
      shadow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Product (with the one-off light sweep mid-clip).
      const s = sweepAt(p);
      const layer = s == null ? this._productLayer : this._sweepLayer(s);
      ctx.save();
      ctx.translate(px, ay + m.product.y);
      ctx.scale(sx, sy);
      ctx.drawImage(layer, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // 4. Subtle film grain (cycled tiles, random offset each frame).
    this._frame += 1;
    const pattern = this._grain[this._frame % this._grain.length];
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = LAYOUT.grainAlpha;
    ctx.translate((Math.random() * 160) | 0, (Math.random() * 160) | 0);
    ctx.fillStyle = pattern;
    ctx.fillRect(-160, -160, W + 320, H + 320);
    ctx.restore();
  }
}
