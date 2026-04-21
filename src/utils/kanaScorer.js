/**
 * kanaScorer.js
 * 純前端假名手寫評分工具
 * 使用 Canvas 像素比對（膨脹 IoU）實現，不依賴任何外部 API
 *
 * v2 改進：
 *  - 加入 Bounding Box 置中正規化，解決筆跡偏角落導致低分的問題
 *  - 參考字形像素加入 Map 快取，避免同一字重複渲染
 */

const CANVAS_SIZE = 160;     // 內部比對解析度 (提升至 160 增加細線假名辨識)
const DILATION_RADIUS = 7;   // 因應解析度提升，調整膨脹半徑 (原5 -> 7)
const DARK_THRESHOLD = 140;  // 像素亮度閾值 (0=純黑, 255=純白)
const MIN_BBOX_MARGIN = 6;   // 置中後保留的最小邊距（像素）

/** 參考字形像素快取（避免同一字重複渲染） */
const refPixelCache = new Map();

/**
 * 評分主函式
 * @param {HTMLCanvasElement} userCanvas - KanaCanvas 的實際 canvas 元素
 * @param {string} targetChar - 用戶應該要寫的字元
 * @returns {{ score: number, label: string, color: string, emoji: string }}
 */
export function scoreHandwriting(userCanvas, targetChar) {
  if (!userCanvas || !targetChar) {
    return { score: 0, label: '未作答', color: '#94a3b8', emoji: '✏️' };
  }

  // 1. 取得用戶手寫的縮放版像素陣列（已置中正規化）
  const userPixels = getDownsampledDarkPixels(userCanvas);
  const userPixelCount = userPixels.reduce((a, b) => a + b, 0);

  // 若幾乎空白，判定為未作答
  if (userPixelCount < 50) {
    return { score: 0, label: '請先寫字', color: '#94a3b8', emoji: '✏️' };
  }

  // 2. 渲染目標字元到像素陣列（已置中正規化 + 快取）
  const refPixels = renderCharToPixels(targetChar);

  // 3. 膨脹像素（增加容錯範圍）
  const dilatedUser = dilate(userPixels, CANVAS_SIZE);
  const dilatedRef  = dilate(refPixels,  CANVAS_SIZE);

  // 4. 計算覆蓋率 (recall) 與精準率 (precision)
  let coverageIntersection = 0;
  let precisionIntersection = 0;
  let userCount = 0;
  let refCount = 0;

  for (let i = 0; i < CANVAS_SIZE * CANVAS_SIZE; i++) {
    if (userPixels[i]) userCount++;
    if (refPixels[i])  refCount++;
    if (dilatedUser[i] && refPixels[i])  coverageIntersection++;
    if (userPixels[i]  && dilatedRef[i]) precisionIntersection++;
  }

  // 覆蓋率：用戶寫的區域有多少命中了參考字？
  const coverage  = refCount  > 0 ? coverageIntersection  / refCount  : 0;
  // 精準率：用戶的筆劃有多少落在正確區域？（多餘筆畫會拉低此值）
  const precision = userCount > 0 ? precisionIntersection / userCount : 0;

  // 綜合分數：透過 precision 平方放大對「多餘筆畫」的懲罰
  let rawScore = (coverage * 0.5 + Math.pow(precision, 2) * 0.5) * 100;

  // 【多餘筆畫極端懲罰】若精準率過低（寫太多或亂塗），給予斷崖式扣分
  if (precision < 0.65) {
    rawScore *= (precision / 0.65);
  }

  // 輕微加成讓正常書寫更容易達到滿分
  const score = Math.round(Math.min(100, Math.max(0, rawScore * 1.15)));

  return getRating(score);
}

/** 分數等級對照 */
function getRating(score) {
  if (score >= 85) return { score, label: '非常棒！', color: '#10b981', emoji: '⭐' };
  if (score >= 70) return { score, label: '不錯！',   color: '#3b82f6', emoji: '✅' };
  if (score >= 50) return { score, label: '加油！',   color: '#f59e0b', emoji: '🔶' };
  return                  { score, label: '再試一次', color: '#ef4444', emoji: '❌' };
}

// ─────────────────────────────────────────────────────────
// 置中正規化核心函式
// ─────────────────────────────────────────────────────────

/**
 * 找出像素陣列中有效（深色）內容的邊界框
 * @returns {{ minX, minY, maxX, maxY }} 若全空則回傳 null
 */
function getBoundingBox(pixels, size) {
  let minX = size, minY = size, maxX = -1, maxY = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (pixels[y * size + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null; // 全空
  return { minX, minY, maxX, maxY };
}

/**
 * 將筆跡裁切並等比例置中到新的 CANVAS_SIZE x CANVAS_SIZE 陣列
 * - 保留 MIN_BBOX_MARGIN 像素邊距
 * - 等比例縮放，不拉伸
 */
function cropAndCenter(pixels, size) {
  const bbox = getBoundingBox(pixels, size);
  if (!bbox) return pixels; // 空白直接回傳

  const { minX, minY, maxX, maxY } = bbox;
  const bboxW = maxX - minX + 1;
  const bboxH = maxY - minY + 1;

  // 目標區域（留邊距後可用的最大正方形）
  const targetSize = size - MIN_BBOX_MARGIN * 2;
  const scale = Math.min(targetSize / bboxW, targetSize / bboxH);

  const scaledW = Math.round(bboxW * scale);
  const scaledH = Math.round(bboxH * scale);
  const offsetX = Math.round((size - scaledW) / 2);
  const offsetY = Math.round((size - scaledH) / 2);

  const result = new Uint8Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 映射回原始座標
      const srcX = Math.round((x - offsetX) / scale) + minX;
      const srcY = Math.round((y - offsetY) / scale) + minY;
      if (srcX >= minX && srcX <= maxX && srcY >= minY && srcY <= maxY) {
        result[y * size + x] = pixels[srcY * size + srcX];
      }
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────
// 像素提取函式
// ─────────────────────────────────────────────────────────

/**
 * 把用戶的 Canvas 縮放到 CANVAS_SIZE x CANVAS_SIZE，
 * 並進行 Bounding Box 置中正規化後提取深色像素
 */
function getDownsampledDarkPixels(sourceCanvas) {
  const offscreen = document.createElement('canvas');
  offscreen.width  = CANVAS_SIZE;
  offscreen.height = CANVAS_SIZE;
  const ctx = offscreen.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.drawImage(sourceCanvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const raw = extractDark(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
  // 置中正規化：把筆跡移到畫布中央
  return cropAndCenter(raw, CANVAS_SIZE);
}

/**
 * 用瀏覽器字型渲染目標假名，進行置中正規化後提取深色像素
 * 結果會被 Map 快取，相同字元不重複渲染
 */
function renderCharToPixels(char) {
  if (refPixelCache.has(char)) return refPixelCache.get(char);

  const offscreen = document.createElement('canvas');
  offscreen.width  = CANVAS_SIZE;
  offscreen.height = CANVAS_SIZE;
  const ctx = offscreen.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const fontSize = Math.floor(CANVAS_SIZE * 0.82);
  ctx.font = `${fontSize}px "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, CANVAS_SIZE / 2, CANVAS_SIZE * 0.53);

  const raw = extractDark(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
  // 置中正規化：確保參考字形也以相同方式置中
  const centered = cropAndCenter(raw, CANVAS_SIZE);
  refPixelCache.set(char, centered);
  return centered;
}

/** 提取 ImageData 中的深色像素（二值化） */
function extractDark(imageData) {
  const pixels = new Uint8Array(CANVAS_SIZE * CANVAS_SIZE);
  for (let i = 0; i < CANVAS_SIZE * CANVAS_SIZE; i++) {
    const base = i * 4;
    const brightness = (imageData.data[base] + imageData.data[base + 1] + imageData.data[base + 2]) / 3;
    pixels[i] = brightness < DARK_THRESHOLD ? 1 : 0;
  }
  return pixels;
}

/** 膨脹操作：以 DILATION_RADIUS 為半徑擴展每個深色像素 */
function dilate(pixels, size) {
  const result = new Uint8Array(size * size);
  const r = DILATION_RADIUS;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!pixels[y * size + x]) continue;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            result[ny * size + nx] = 1;
          }
        }
      }
    }
  }
  return result;
}
