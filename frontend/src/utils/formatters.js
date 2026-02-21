// Saniye cinsinden süreyi h:mm:ss veya mm:ss formatına çevirir.
// Örnek: 8820 → "2:27:00", 185 → "3:05"
export const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '';
    const totalSeconds = Math.floor(Number(seconds));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const formatViews = (viewsCount) => {
    if (!viewsCount) return '';
    const num = Number(viewsCount);
    if (isNaN(num)) return viewsCount; // Return as-is if it's already a string like 'Watching now'

    if (num < 1000) {
        return num.toString();
    } else if (num < 1000000) {
        // e.g., 1500 -> 1.5K
        const divided = num / 1000;
        return (Number.isInteger(divided) ? divided : divided.toFixed(1)) + 'K';
    } else {
        // e.g., 1500000 -> 1.5M
        const divided = num / 1000000;
        return (Number.isInteger(divided) ? divided : divided.toFixed(1)) + 'M';
    }
};
