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
