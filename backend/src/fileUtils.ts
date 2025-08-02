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

export async function convertImageToSvg(inputPath: string, outputPath: string): Promise<void> {
    const buffer = await fs.readFile(inputPath);
    const { width, height } = await sharp(buffer).metadata();
    
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${buffer.toString('base64')}"/>
</svg>`;
    
    await fs.writeFile(outputPath, svgContent);
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