/**
 * kanaScorer.js
 * 純前端假名手寫評分工具
 * 使用 Canvas 像素比對（膨脹 IoU）實現，不依賴任何外部 API
 */

const CANVAS_SIZE = 96;      // 內部比對解析度 (越大越精確，越小越快)
const DILATION_RADIUS = 7;   // 像素膨脹半徑（容錯用，用戶的筆劃較細）
const DARK_THRESHOLD = 140;  // 像素亮度閾值 (0=純黑, 255=純白)

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

  // 1. 取得用戶手寫的縮放版像素陣列
  const userPixels = getDownsampledDarkPixels(userCanvas);
  const userPixelCount = userPixels.reduce((a, b) => a + b, 0);

  // 若幾乎空白，判定為未作答
  if (userPixelCount < 40) {
    return { score: 0, label: '請先寫字', color: '#94a3b8', emoji: '✏️' };
  }

  // 2. 渲染目標字元到像素陣列
  const refPixels = renderCharToPixels(targetChar);

  // 3. 膨脹像素（增加容錯範圍）
  const dilatedUser = dilate(userPixels, CANVAS_SIZE);
  const dilatedRef  = dilate(refPixels,  CANVAS_SIZE);

  // 4. 計算覆蓋率 (recall) 與精準率 (precision)
  let coverageIntersection = 0; // user (dilated) hits ref (original)
  let precisionIntersection = 0; // user (original) hits ref (dilated)
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
  // 精準率：用戶的筆劃有多少落在正確區域？
  const precision = userCount > 0 ? precisionIntersection / userCount : 0;

  // 綜合分數 (偏重覆蓋率)
  const rawScore = (coverage * 0.65 + precision * 0.35) * 100;
  // 輕微加成讓分數更直觀（不會因為字型差異太嚴苛）
  const score = Math.round(Math.min(100, rawScore * 1.18));

  return getRating(score);
}

/** 分數等級對照 */
function getRating(score) {
  if (score >= 85) return { score, label: '非常棒！', color: '#10b981', emoji: '⭐' };
  if (score >= 70) return { score, label: '不錯！',   color: '#3b82f6', emoji: '✅' };
  if (score >= 50) return { score, label: '加油！',   color: '#f59e0b', emoji: '🔶' };
  return                  { score, label: '再試一次', color: '#ef4444', emoji: '❌' };
}

/** 把用戶的 Canvas 縮放到 CANVAS_SIZE x CANVAS_SIZE 並提取深色像素 */
function getDownsampledDarkPixels(sourceCanvas) {
  const offscreen = document.createElement('canvas');
  offscreen.width  = CANVAS_SIZE;
  offscreen.height = CANVAS_SIZE;
  const ctx = offscreen.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  // drawImage 會正確處理 HiDPI 縮放（以 canvas.width/height 為基準）
  ctx.drawImage(sourceCanvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  return extractDark(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
}

/** 用瀏覽器字型渲染目標假名，提取深色像素 */
function renderCharToPixels(char) {
  const offscreen = document.createElement('canvas');
  offscreen.width  = CANVAS_SIZE;
  offscreen.height = CANVAS_SIZE;
  const ctx = offscreen.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // 使用日文字型，填滿 82% 的畫布
  const fontSize = Math.floor(CANVAS_SIZE * 0.82);
  // 使用 sans-serif 字型堆疊，確保日文字元正確渲染
  ctx.font = `${fontSize}px "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, CANVAS_SIZE / 2, CANVAS_SIZE * 0.53);

  return extractDark(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
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
