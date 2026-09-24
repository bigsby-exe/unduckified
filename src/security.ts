export interface Bang {
    c?: string;
    d: string;
    r?: number;
    s: string;
    sc?: string;
    t: string;
    u: string;
}

export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]!);
}

export function safeHttpUrl(value: string, allowBareDomain = false): string | null {
    // Reject control characters instead of letting URL silently remove them.
    if (/[\u0000-\u0020\u007f]/.test(value)) return null;
    const candidate = allowBareDomain && !/^[a-z][a-z\d+.-]*:/i.test(value)
        ? `https://${value}` : value;
    try {
        const url = new URL(candidate);
        return ["http:", "https:"].includes(url.protocol) && url.hostname &&
            !url.username && !url.password ? url.href : null;
    } catch { return null; }
}

export function readCustomBangs(raw: string | null): Record<string, Bang> {
    const result: Record<string, Bang> = Object.create(null);
    try {
        const value: unknown = JSON.parse(raw ?? "{}");
        if (!value || typeof value !== "object" || Array.isArray(value)) return result;
        for (const [shortcut, entry] of Object.entries(value)) {
            if (!/^[^\s!]+$/.test(shortcut) || !entry || typeof entry !== "object" ||
                typeof entry.s !== "string" || typeof entry.t !== "string" ||
                typeof entry.u !== "string" || typeof entry.d !== "string" ||
                !entry.u.includes("{{{s}}}") || !safeHttpUrl(entry.u) ||
                !safeHttpUrl(entry.d, true)) continue;
            // Older custom entries reversed the title and shortcut fields.
            result[shortcut] = { ...entry, t: shortcut,
                s: entry.s === shortcut && entry.t !== shortcut ? entry.t : entry.s, r: 0 };
        }
    } catch { /* Malformed persisted settings must not stop searches. */ }
    return result;
}
