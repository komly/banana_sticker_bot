import fs from 'fs';
import path from 'path';
import { Api } from 'grammy';

export async function downloadTelegramFile(
    api: Api,
    fileId: string,
    downloadPath: string
): Promise<string> {
    // Ensure temp directory exists
    const tempDir = path.dirname(downloadPath);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Get file path from Telegram
    const file = await api.getFile(fileId);

    if (!file.file_path) {
        throw new Error('File path not available');
    }

    // Download file
    const fileUrl = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
    const response = await fetch(fileUrl);

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to disk
    await fs.promises.writeFile(downloadPath, buffer);

    return downloadPath;
}

export function ensureTempDir(): string {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
}

export function cleanupFile(filePath: string): void {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error cleaning up file:', error);
    }
}
