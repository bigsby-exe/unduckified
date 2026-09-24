import { safeHttpUrl, type Bang } from "./security.ts";

type Bangs = Record<string, Bang>;

export function findBang(shortcut: string, custom: Bangs, builtIn: Bangs): Bang | undefined {
    if (Object.prototype.hasOwnProperty.call(custom, shortcut)) return custom[shortcut];
    if (Object.prototype.hasOwnProperty.call(builtIn, shortcut)) return builtIn[shortcut];
    return undefined;
}

export function resolveSearch(query: string, defaultShortcut: string, custom: Bangs, builtIn: Bangs) {
    const fallback = findBang(defaultShortcut, custom, builtIn) ?? findBang("ddg", {}, builtIn);
    // Support !gh query, gh! query, and query !gh; remove only the matched token.
    const match = /^(?:!([^\s!]+)|([^\s!]+)!)(?:\s+|$)|(?:^|\s+)!([^\s!]+)$/.exec(query);
    const shortcut = match && (match[1] || match[2] || match[3]).toLowerCase();
    const selected = shortcut ? findBang(shortcut, custom, builtIn) : undefined;
    const bang = selected ?? fallback;
    if (!bang) return null;
    const cleanQuery = selected && match
        ? (query.slice(0, match.index) + query.slice(match.index + match[0].length)).trim()
        : query;
    // Kagi site-search templates are relative to Kagi, never to this app.
    const template = bang.u.startsWith("/search?") ? `https://kagi.com${bang.u}` : bang.u;
    const destination = !cleanQuery
        ? safeHttpUrl(bang.d, true)
        : safeHttpUrl(template.split("{{{s}}}").join(encodeURIComponent(cleanQuery).replace(/%2F/g, "/")));
    return destination ? { url: destination, query: cleanQuery, bang } : null;
}
