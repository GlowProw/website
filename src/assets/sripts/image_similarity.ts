/**
 * 图像相似度计算工具库 - 模糊图片匹配版本
 * 提供多种模糊图像相似度比较算法，支持不同尺寸图片
 */

// ==================== 基础工具函数 ====================

/**
 * 从图片URL加载为ImageData对象（不调整尺寸，保持原样）
 * @param imageUrl - 图片URL
 * @returns Promise<ImageData>
 */
export async function loadImageToImageData(imageUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('Failed to get canvas context'))
                return;
            }

            // 保持原尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            resolve(imageData)
        };
        img.onerror = reject;
        img.src = imageUrl;
    })
}

/**
 * 将图像缩放到指定尺寸 (支持 Worker 环境)
 * @param imageData - 原始ImageData
 * @param width - 目标宽度
 * @param height - 目标高度
 * @returns 缩放后的ImageData
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
 * 将ImageData转换为灰度值数组
 * @param imageData - ImageData对象
 * @returns 灰度值数组
 */
export function imageDataToGrayValues(imageData: ImageData): number[] {
    const data = imageData.data;
    const grayValues: number[] = [];

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // 使用亮度公式计算灰度：Y = 0.299R + 0.587G + 0.114B
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayValues.push(gray)
    }

    return grayValues;
}

// ==================== 感知哈希算法 ====================

/**
 * 从 ImageData 计算哈希值
 */
export function computeHash(imageData: ImageData): string {
    const resizedData = resizeImageData(imageData, 8, 8) // 统一缩放到8x8
    const grayValues = imageDataToGrayValues(resizedData)

    // 计算灰度平均值
    const average = grayValues.reduce((sum, val) => sum + val, 0) / grayValues.length;

    // 生成哈希字符串：大于等于平均值为'1'，否则为'0'
    return grayValues.map(gray => (gray >= average ? '1' : '0')).join('');
}

/**
 * 生成感知哈希（pHash）
 * @param imageUrl - 图片URL
 * @returns 64位二进制哈希字符串
 */
export async function getImageHash(imageUrl: string): Promise<string> {
    const imageData = await loadImageToImageData(imageUrl)
    return computeHash(imageData);
}

/**
 * 计算哈希相似度（汉明距离）
 * 汉明距离越小，图片越相似
 * @param hash1 - 第一个哈希值
 * @param hash2 - 第二个哈希值
 * @returns 相似度百分比 (0-100)
 */
export function calculateHashSimilarity(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
        // 如果长度不同，使用较短的作为基准
        const minLength = Math.min(hash1.length, hash2.length)
        let distance = 0;
        for (let i = 0; i < minLength; i++) {
            if (hash1[i] !== hash2[i]) {
                distance++;
            }
        }
        // 考虑长度差异的惩罚
        const lengthPenalty = Math.abs(hash1.length - hash2.length) * 0.5;
        const totalDistance = distance + lengthPenalty;
        return (1 - totalDistance / Math.max(hash1.length, hash2.length)) * 100;
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) {
            distance++;
        }
    }

    const diffRatio = distance / hash1.length;
    // 汉明距离>0.4 通常意味着完全不同的图片
    return Math.max(0, (1 - diffRatio * 2.5) * 100);
}

// ==================== 颜色直方图算法 ====================

/**
 * 计算颜色直方图
 * 将RGB颜色空间量化为64种颜色（4x4x4），统计颜色分布
 * 算法鲁棒性好，对尺寸变化不敏感
 * @param imageData - ImageData对象
 * @param bins - 颜色区间数量，默认64
 * @returns 归一化的颜色直方图数组
 */
export function computeColorHistogram(
    imageData: ImageData,
    bins: number = 64
): number[] {
    const data = imageData.data;
    const histogram = new Array(bins).fill(0)
    const totalPixels = data.length / 4;

    // 颜色量化：将RGB各分为4个区间（0-63, 64-127, 128-191, 192-255）
    for (let i = 0; i < data.length; i += 4) {
        const r = Math.floor(data[i] / 64)     // 0-3
        const g = Math.floor(data[i + 1] / 64) // 0-3
        const b = Math.floor(data[i + 2] / 64) // 0-3
        const index = r * 16 + g * 4 + b;       // 0-63
        histogram[index]++;
    }

    // 归一化处理（使不同尺寸图片可比较）
    return histogram.map(count => count / totalPixels)
}

/**
 * 计算直方图相似度（巴氏距离）
 * 巴氏距离：BC(P,Q) = Σ√(P(i) * Q(i))
 * 范围[0,1]，值越大越相似
 * @param hist1 - 第一个直方图
 * @param hist2 - 第二个直方图
 * @returns 相似度百分比 (0-100)
 */
export function compareHistograms(hist1: number[], hist2: number[]): number {
    // 使用最短的长度作为比较基准
    const minLength = Math.min(hist1.length, hist2.length)
    let bhattacharyyaDist = 0;

    for (let i = 0; i < minLength; i++) {
        bhattacharyyaDist += Math.sqrt(hist1[i] * hist2[i])
    }

    // 通过平方根和指数放大差异的敏感度
    let similarity = Math.pow(bhattacharyyaDist, 3) * 100;
    return similarity;
}

// ==================== 结构相似性算法 ====================

/**
 * 计算结构相似性特征
 * 提取图像的亮度、对比度等结构特征
 * 对尺寸变化有很好的鲁棒性
 * @param imageData - ImageData对象
 * @returns 结构特征数组 [平均亮度, 对比度]
 */
export function computeStructuralFeatures(imageData: ImageData): number[] {
    const grayValues = imageDataToGrayValues(imageData)
    const features: number[] = [];

    // 平均亮度（归一化到[0,1]）
    const totalLuminance = grayValues.reduce((sum, val) => sum + val, 0)
    const meanLuminance = totalLuminance / grayValues.length;
    features.push(meanLuminance / 255)

    // 对比度（标准差，归一化到[0,1]）
    let variance = 0;
    for (const luminance of grayValues) {
        variance += Math.pow(luminance - meanLuminance, 2)
    }
    const contrast = Math.sqrt(variance / grayValues.length) / 255;
    features.push(contrast)

    // 纹理复杂度（边缘密度估计）
    let edgeCount = 0;
    for (let i = 1; i < grayValues.length; i++) {
        if (Math.abs(grayValues[i] - grayValues[i - 1]) > 20) { // 简单的边缘检测阈值
            edgeCount++;
        }
    }
    const texture = edgeCount / grayValues.length;
    features.push(texture)

    return features;
}

/**
 * 比较结构特征相似度
 * 使用加权平均计算整体相似度
 * @param features1 - 第一个特征数组
 * @param features2 - 第二个特征数组
 * @returns 相似度百分比 (0-100)
 */
export function compareStructuralFeatures(
    features1: number[],
    features2: number[]
): number {
    // 使用最短的长度作为比较基准
    const minLength = Math.min(features1.length, features2.length)

    let similarity = 0;
    // 权重分配：亮度(0.4), 对比度(0.4), 纹理(0.2)
    const weights = [0.4, 0.4, 0.2];

    for (let i = 0; i < minLength; i++) {
        const weight = i < weights.length ? weights[i] : 1 / minLength;
        const diff = Math.abs(features1[i] - features2[i])
        // 使用更严厉的惩罚
        similarity += Math.max(0, 1 - diff * 2.5) * weight;
    }

    return Math.pow(similarity, 3) * 100;
}

// ==================== 分块特征匹配算法 ====================

/**
 * 计算图像分块特征（自适应网格）
 * 根据图像尺寸动态确定网格大小
 * @param imageData - ImageData对象
 * @returns 分块特征数组
 */
export function computeBlockFeatures(imageData: ImageData): number[] {
    // 强制把图片变为一个固定大小 (例如64x64) 以使得特征数组长度永远相同并且空间对齐
    const width = 64;
    const height = 64;
    const resizedData = resizeImageData(imageData, width, height);
    const data = resizedData.data;
    const features: number[] = [];

    // 固定网格: 8x8，能够提取64个块的信息
    let gridSize = 8;

    const blockWidth = Math.floor(width / gridSize)
    const blockHeight = Math.floor(height / gridSize)

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

                    const max = Math.max(r, g, b)
                    const min = Math.min(r, g, b)
                    const saturation = max === 0 ? 0 : (max - min) / max;
                    blockSaturation += saturation;

                    blockColorRed += r;
                    blockColorGreen += g;
                    blockColorBlue += b;

                    pixelCount++;
                }
            }

            features.push(blockLuminance / pixelCount / 255)
            features.push(blockSaturation / pixelCount)
            features.push(blockColorRed / pixelCount / 255)
            features.push(blockColorGreen / pixelCount / 255)
            features.push(blockColorBlue / pixelCount / 255)
        }
    }

    return features;
}

/**
 * 比较分块特征相似度
 * 逐个块比对特征差异
 * @param blocks1 - 第一个特征数组
 * @param blocks2 - 第二个特征数组
 * @returns 相似度百分比 (0-100)
 */
export function compareBlockFeatures(
    blocks1: number[],
    blocks2: number[]
): number {
    const minLength = Math.min(blocks1.length, blocks2.length)
    if (minLength === 0) return 0;

    let sumSq = 0;
    for (let i = 0; i < minLength; i++) {
        const diff = blocks1[i] - blocks2[i]
        sumSq += diff * diff;
    }

    // 均方根差异
    const rmsDiff = Math.sqrt(sumSq / minLength);

    // 把可容忍范围压得非常低，稍微不同（如RGB各差异过0.15）就导致分数为0
    // rmsDiff 是个均方根百分比差异，通常即使完全不同的图也在0.2~0.4之间
    const similarity = Math.max(0, 1 - rmsDiff * 3);

    // 指数惩罚让视觉拉开差距
    return Math.pow(similarity, 3) * 100;
}

// ==================== 综合相似度计算 ====================

/**
 * 统一图像相似度计算接口
 * @param algorithm - 算法类型
 * @param imageUrl1 - 第一张图片URL
 * @param imageUrl2 - 第二张图片URL
 * @returns 相似度百分比 (0-100)
 */
export async function calculateImageSimilarity(
    algorithm: 'perceptual-hash' | 'color-histogram' | 'structural-similarity' | 'feature-matching',
    imageUrl1: string,
    imageUrl2: string
): Promise<number> {
    switch (algorithm) {
        case 'perceptual-hash':
            const hash1 = await getImageHash(imageUrl1)
            const hash2 = await getImageHash(imageUrl2)
            return calculateHashSimilarity(hash1, hash2)

        case 'color-histogram':
            const imageData1 = await loadImageToImageData(imageUrl1)
            const imageData2 = await loadImageToImageData(imageUrl2)
            const hist1 = computeColorHistogram(imageData1)
            const hist2 = computeColorHistogram(imageData2)
            return compareHistograms(hist1, hist2)

        case 'structural-similarity':
            const structData1 = await loadImageToImageData(imageUrl1)
            const structData2 = await loadImageToImageData(imageUrl2)
            const features1 = computeStructuralFeatures(structData1)
            const features2 = computeStructuralFeatures(structData2)
            return compareStructuralFeatures(features1, features2)

        case 'feature-matching':
            const blockData1 = await loadImageToImageData(imageUrl1)
            const blockData2 = await loadImageToImageData(imageUrl2)
            const blocks1 = computeBlockFeatures(blockData1)
            const blocks2 = computeBlockFeatures(blockData2)
            return compareBlockFeatures(blocks1, blocks2)

        default:
            return 0; // 默认返回0而不是抛出错误
    }
}

// ==================== TensorFlow.js 深度学习相似度 ====================

let _mobilenetModel: any = null;
let _mobilenetLoading: Promise<any> | null = null;

/**
 * 懒加载 MobileNet 模型（单例模式）
 * 首次调用时加载模型，之后复用缓存
 */
export async function loadMobileNetModel(): Promise<any> {
    if (_mobilenetModel) return _mobilenetModel;
    if (_mobilenetLoading) return _mobilenetLoading;

    _mobilenetLoading = (async () => {
        const tf = await import('@tensorflow/tfjs');
        const mobilenet = await import('@tensorflow-models/mobilenet');
        await tf.ready();
        _mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        return _mobilenetModel;
    })();

    _mobilenetModel = await _mobilenetLoading;
    _mobilenetLoading = null;
    return _mobilenetModel;
}

/**
 * 使用 MobileNet 提取图片的嵌入向量（特征向量）
 * @param imageUrl - 图片URL（data:URL 或 http URL）
 * @returns 归一化后的嵌入向量数组
 */
export async function computeTFEmbedding(imageUrl: string, grayscale = false): Promise<number[]> {
    const tf = await import('@tensorflow/tfjs');
    const model = await loadMobileNetModel();

    // MobileNet v2 训练输入分辨率为 224x224，必须先缩放到此尺寸再推理
    const INPUT_SIZE = 224;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            try {
                // 缩放到 224x224
                const canvas = document.createElement('canvas');
                canvas.width = INPUT_SIZE;
                canvas.height = INPUT_SIZE;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Canvas context error')); return; }
                ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);

                // 灰度模式：将 RGB 转换为亮度灰度，消除颜色偏差
                if (grayscale) {
                    const imgData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
                    const d = imgData.data;
                    for (let i = 0; i < d.length; i += 4) {
                        const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                        d[i] = d[i + 1] = d[i + 2] = luma;
                    }
                    ctx.putImageData(imgData, 0, 0);
                }

                const tensor = tf.browser.fromPixels(canvas); // shape [224, 224, 3]
                // infer(true) 提取全局平均池化层特征向量（1280维）
                const embedding = model.infer(tensor, true) as any;
                const values: Float32Array = await embedding.data();
                tensor.dispose();
                embedding.dispose();
                resolve(Array.from(values));
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}


/**
 * 计算两个向量间的余弦相似度
 * @param a - 第一个向量
 * @param b - 第二个向量
 * @returns 相似度百分比 (0-100)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < len; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));

    return Math.max(0, cosine) * 100;
}

