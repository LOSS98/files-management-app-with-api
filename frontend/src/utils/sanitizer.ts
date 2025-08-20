export function sanitizeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

export function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const validateApiKey = (apiKey: string): boolean => {
    return /^app_[a-f0-9]{32}$/.test(apiKey);
};

export const validateFilename = (filename: string): boolean => {
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(filename) && filename.trim().length > 0;
};