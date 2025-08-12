import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export async function ensureDirectoryExists(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

export function generateUniqueFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    return `${nameWithoutExt}_${uuidv4()}${ext}`;
}

export async function convertImageToWebp(inputPath: string, outputPath: string): Promise<void> {
    const buffer = await fs.readFile(inputPath);
    const webpBuffer = await sharp(buffer)
        .webp({ 
            quality: 40,
            effort: 6,
            lossless: false,
            nearLossless: false,
            smartSubsample: true
        })
        .toBuffer();
    
    await fs.writeFile(outputPath, webpBuffer);
}

export async function deleteFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
    }
}

export async function getFileStats(filePath: string) {
    const stats = await fs.stat(filePath);
    return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
    };
}