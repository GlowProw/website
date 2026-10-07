/**
 * 基础图像相似度计算纯算法模块 (轻量级，供 Web Worker 和主线程共享)
 * 仅包含纯 JS/Canvas 图像特征提取，不依赖 TensorFlow 或 Transformers 等重型依赖
 */

/**
 * 将图像缩放到指定尺寸 (支持 Worker 环境)
 */
export function resizeImageData(imageData: ImageData, width: number, height: number): ImageData {
    let canvas: any;
    let tempCanvas: any;

    if (typeof OffscreenCanvas !== 'undefined') {
        canvas = new OffscreenCanvas(width, height);
        tempCanvas = new OffscreenCanvas(imageData.width, imageData.height);
    } else {
        canvas = document.createElement('canvas');
        tempCanvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
    }

    const ctx = canvas.getContext('2d');
    const tempCtx = tempCanvas.getContext('2d');
    if (!ctx || !tempCtx) throw new Error('Failed to get canvas context');

    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, width, height);

    return ctx.getImageData(0, 0, width, height);
}

/**
 * 将 ImageData 转换为灰度值数组
 */
export function imageDataToGrayValues(imageData: ImageData): number[] {
    const data = imageData.data;
    const grayValues: number[] = [];

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayValues.push(gray);
    }

    return grayValues;
}

// 感知哈希算法

/**
 * 从 ImageData 计算哈希值
 */
export function computeHash(imageData: ImageData): string {
    const resizedData = resizeImageData(imageData, 8, 8);
    const grayValues = imageDataToGrayValues(resizedData);
    const average = grayValues.reduce((sum, val) => sum + val, 0) / grayValues.length;
    return grayValues.map(gray => (gray >= average ? '1' : '0')).join('');
}

/**
 * 计算哈希相似度（汉明距离）
 */
export function calculateHashSimilarity(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
        const minLength = Math.min(hash1.length, hash2.length);
        let distance = 0;
        for (let i = 0; i < minLength; i++) {
            if (hash1[i] !== hash2[i]) distance++;
        }
        const lengthPenalty = Math.abs(hash1.length - hash2.length) * 0.5;
        const totalDistance = distance + lengthPenalty;
        return (1 - totalDistance / Math.max(hash1.length, hash2.length)) * 100;
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) distance++;
    }

    const diffRatio = distance / hash1.length;
    return Math.max(0, (1 - diffRatio * 2.5) * 100);
}

// 颜色直方图算法

/**
 * 计算颜色直方图
 */
export function computeColorHistogram(
    imageData: ImageData,
    bins: number = 64
): number[] {
    const data = imageData.data;
    const histogram = new Array(bins).fill(0);
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        const r = Math.floor(data[i] / 64);
        const g = Math.floor(data[i + 1] / 64);
        const b = Math.floor(data[i + 2] / 64);
        const index = r * 16 + g * 4 + b;
        histogram[index]++;
    }

    return histogram.map(count => count / totalPixels);
}

/**
 * 计算直方图相似度（巴氏距离）
 */
export function compareHistograms(hist1: number[], hist2: number[]): number {
    const minLength = Math.min(hist1.length, hist2.length);
    let bhattacharyyaDist = 0;

    for (let i = 0; i < minLength; i++) {
        bhattacharyyaDist += Math.sqrt(hist1[i] * hist2[i]);
    }

    return Math.pow(bhattacharyyaDist, 3) * 100;
}

// 结构相似性算法

/**
 * 计算结构相似性特征
 */
export function computeStructuralFeatures(imageData: ImageData): number[] {
    const grayValues = imageDataToGrayValues(imageData);
    const features: number[] = [];

    const totalLuminance = grayValues.reduce((sum, val) => sum + val, 0);
    const meanLuminance = totalLuminance / grayValues.length;
    features.push(meanLuminance / 255);

    let variance = 0;
    for (const luminance of grayValues) {
        variance += Math.pow(luminance - meanLuminance, 2);
    }
    const contrast = Math.sqrt(variance / grayValues.length) / 255;
    features.push(contrast);

    return features;
}

/**
 * 比较结构特征相似度
 */
export function compareStructuralFeatures(
    features1: number[],
    features2: number[]
): number {
    const minLength = Math.min(features1.length, features2.length);
    let similarity = 0;
    const weights = [0.4, 0.4, 0.2];

    for (let i = 0; i < minLength; i++) {
        const weight = i < weights.length ? weights[i] : 1 / minLength;
        const diff = Math.abs(features1[i] - features2[i]);
        similarity += Math.max(0, 1 - diff * 2.5) * weight;
    }

    return Math.pow(similarity, 3) * 100;
}

// 分块特征匹配算法

/**
 * 计算图像分块特征（自适应网格）
 */
export function computeBlockFeatures(imageData: ImageData): number[] {
    const width = 64;
    const height = 64;
    const resizedData = resizeImageData(imageData, width, height);
    const data = resizedData.data;
    const features: number[] = [];

    const gridSize = 8;
    const blockWidth = Math.floor(width / gridSize);
    const blockHeight = Math.floor(height / gridSize);

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            let blockLuminance = 0;
            let pixelCount = 0;
            let blockSaturation = 0;
            let blockColorRed = 0, blockColorGreen = 0, blockColorBlue = 0;

            for (let y = row * blockHeight; y < (row + 1) * blockHeight && y < height; y++) {
                for (let x = col * blockWidth; x < (col + 1) * blockWidth && x < width; x++) {
                    const index = (y * width + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];

                    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                    blockLuminance += luminance;

                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const saturation = max === 0 ? 0 : (max - min) / max;
                    blockSaturation += saturation;

                    blockColorRed += r;
                    blockColorGreen += g;
                    blockColorBlue += b;

                    pixelCount++;
                }
            }

            features.push(blockLuminance / pixelCount / 255);
            features.push(blockSaturation / pixelCount);
            features.push(blockColorRed / pixelCount / 255);
            features.push(blockColorGreen / pixelCount / 255);
            features.push(blockColorBlue / pixelCount / 255);
        }
    }

    return features;
}

/**
 * 比较分块特征相似度
 */
export function compareBlockFeatures(
    blocks1: number[],
    blocks2: number[]
): number {
    const minLength = Math.min(blocks1.length, blocks2.length);
    if (minLength === 0) return 0;

    let sumSq = 0;
    for (let i = 0; i < minLength; i++) {
        const diff = blocks1[i] - blocks2[i];
        sumSq += diff * diff;
    }

    const rmsDiff = Math.sqrt(sumSq / minLength);
    const similarity = Math.max(0, 1 - rmsDiff * 3);
    return Math.pow(similarity, 3) * 100;
}
