/**
 * 图像相似度计算 Web Worker
 */

import { computeBlockFeatures, computeColorHistogram, computeStructuralFeatures, computeHash } from './image_similarity';

self.onmessage = async (e) => {
    const { imageUrl } = e.data;

    try {
        // 1. 获取图片数据
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);

        // 2. 使用 OffscreenCanvas 提取 ImageData
        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get OffscreenCanvas context');
        ctx.drawImage(imageBitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // 3. 计算所有特征
        const features: any = {
            hash: computeHash(imageData),
            colorHistogram: computeColorHistogram(imageData),
            structuralFeatures: computeStructuralFeatures(imageData),
            blockFeatures: computeBlockFeatures(imageData)
        };

        // 释放内存
        imageBitmap.close();

        self.postMessage({
            imageUrl,
            features,
            success: true
        });
    } catch (error: any) {
        self.postMessage({
            imageUrl,
            error: error.message,
            success: false
        });
    }
};
