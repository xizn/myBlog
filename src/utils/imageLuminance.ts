export interface ImageZoneLuminance {
  average: number;
  header: number;
  content: number;
  sidebar: number;
  /** 用于 UI 文字色调（顶栏/表单/侧栏加权，偏保守） */
  uiEffective: number;
}

const SAMPLE_SIZE = 64;

function zoneMean(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): number {
  const startX = Math.floor(width * x0);
  const endX = Math.ceil(width * x1);
  const startY = Math.floor(height * y0);
  const endY = Math.ceil(height * y1);
  let sum = 0;
  let count = 0;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const i = (y * width + x) * 4;
      sum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      count += 1;
    }
  }

  return count > 0 ? sum / count : 0.5;
}

/** 分区采样背景图亮度，覆盖顶栏 / 主内容 / 侧栏等 UI 区域 */
export function analyzeImageZoneLuminance(dataUrl: string): Promise<ImageZoneLuminance> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallbackZones());
          return;
        }
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        const average = zoneMean(data, SAMPLE_SIZE, SAMPLE_SIZE, 0, 0, 1, 1);
        const header = zoneMean(data, SAMPLE_SIZE, SAMPLE_SIZE, 0, 0, 1, 0.14);
        const content = zoneMean(data, SAMPLE_SIZE, SAMPLE_SIZE, 0.04, 0.16, 0.64, 0.88);
        const sidebar = zoneMean(data, SAMPLE_SIZE, SAMPLE_SIZE, 0.68, 0.16, 0.98, 0.88);
        const minZone = Math.min(header, content, sidebar);
        const weighted = header * 0.34 + content * 0.4 + sidebar * 0.26;
        const uiEffective = minZone * 0.52 + weighted * 0.48;

        resolve({ average, header, content, sidebar, uiEffective });
      } catch {
        resolve(fallbackZones());
      }
    };
    img.onerror = () => resolve(fallbackZones());
    img.src = dataUrl;
  });
}

/** 兼容旧接口：返回全图平均亮度 */
export function analyzeImageLuminance(dataUrl: string): Promise<number> {
  return analyzeImageZoneLuminance(dataUrl).then((zones) => zones.average);
}

function fallbackZones(): ImageZoneLuminance {
  return {
    average: 0.5,
    header: 0.5,
    content: 0.5,
    sidebar: 0.5,
    uiEffective: 0.5,
  };
}
