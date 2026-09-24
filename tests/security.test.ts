import { describe, expect, test } from "bun:test";
import { escapeHtml, readCustomBangs, safeHttpUrl } from "../src/security.ts";
import { findBang, resolveSearch } from "../src/search.ts";
import { addToSearchHistory, clearSearchHistory, getSearchHistory, storage } from "../src/libs.ts";

const ddg = { t: "ddg", s: "DuckDuckGo", d: "duckduckgo.com", u: "https://duckduckgo.com/?q={{{s}}}", r: 0 };
const gh = { ...ddg, t: "gh", s: "GitHub", d: "github.com", u: "https://github.com/search?q={{{s}}}" };
const builtIn = { ddg, gh };

describe("untrusted content", () => {
    test("escapes markup and both attribute quote delimiters", () => {
        expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe("&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;");
    });
    test("allows HTTP(S) only, rejects controls and credentials", () => {
        for (const url of ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "java\nscript:alert(1)", "https://user:pass@example.org", "//evil.example", "not a url"]) {
            expect(safeHttpUrl(url)).toBeNull();
        }
        expect(safeHttpUrl("example.org", true)).toBe("https://example.org/");
        expect(safeHttpUrl("javascript:alert(1)", true)).toBeNull();
        expect(safeHttpUrl("https://example.org/?q={{{s}}}")).toBeTruthy();
    });
    test("recovers corrupt storage, migrates old custom entries, ignores unsafe entries", () => {
        for (const raw of ["{", "null", "[]", "42"]) expect(Object.keys(readCustomBangs(raw))).toHaveLength(0);
        const custom = readCustomBangs(JSON.stringify({ custom: { ...gh, t: "My GitHub", s: "custom" }, bad: { ...gh, u: "javascript:alert(1)//{{{s}}}" } }));
        expect(custom.custom.t).toBe("custom");
        expect(custom.custom.s).toBe("My GitHub");
        expect(custom.bad).toBeUndefined();
        expect(Object.getPrototypeOf(custom)).toBeNull();
    });
});

describe("search routing", () => {
    test("supports prefix, suffix and trailing bang tokens", () => {
        for (const query of ["!gh hello", "gh! hello", "hello !gh", "!GH hello"]) {
            expect(resolveSearch(query, "ddg", {}, builtIn)?.url).toBe("https://github.com/search?q=hello");
        }
        expect(resolveSearch("!gh", "ddg", {}, builtIn)?.url).toBe("https://github.com/");
    });
    test("custom defaults work and missing defaults recover", () => {
        expect(resolveSearch("hello", "mine", { mine: gh }, builtIn)?.bang).toBe(gh);
        expect(resolveSearch("hello", "deleted", {}, builtIn)?.bang).toBe(ddg);
    });
    test("unknown bangs retain the original query in the default engine", () => {
        expect(resolveSearch("!unknown hello", "ddg", {}, builtIn)?.query).toBe("!unknown hello");
        expect(findBang("constructor", {}, builtIn)).toBeUndefined();
        expect(findBang("__proto__", {}, builtIn)).toBeUndefined();
    });
    test("query delimiters cannot introduce URL parameters and remaining bang-like text survives", () => {
        expect(resolveSearch("!gh a&b=#c", "ddg", {}, builtIn)?.url).toBe("https://github.com/search?q=a%26b%3D%23c");
        expect(resolveSearch("!gh hello !ddg", "ddg", {}, builtIn)?.query).toBe("hello !ddg");
    });
    test("Kagi relative site searches resolve to Kagi instead of this app", () => {
        const site = { ...gh, u: "/search?q={{{s}}}+site:github.com" };
        expect(resolveSearch("!site hello", "ddg", {}, { ...builtIn, site })?.url).toBe("https://kagi.com/search?q=hello+site:github.com");
    });
    test("unsafe destinations from built-in or custom data never redirect", () => {
        const bad = { ...gh, u: "javascript:alert(1)//{{{s}}}", d: "javascript:alert(1)" };
        expect(resolveSearch("!bad hello", "ddg", { bad }, builtIn)).toBeNull();
        expect(resolveSearch("!bad", "ddg", { bad }, builtIn)).toBeNull();
    });
});

describe("history resilience", () => {
    test("validates stored data, caps history and does not resurrect cleared entries", () => {
        const data = new Map<string, string>();
        Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
            getItem: (key: string) => data.get(key) ?? null,
            setItem: (key: string, value: string) => data.set(key, value),
            removeItem: (key: string) => data.delete(key),
        } });
        for (const value of ["null", "{}", "[null,42]", "{"]) {
            storage.set("search-history", value);
            expect(getSearchHistory()).toEqual([]);
        }
        const bang = { bang: "ddg", name: "DuckDuckGo", url: ddg.u };
        addToSearchHistory("old", bang);
        clearSearchHistory();
        addToSearchHistory("new", bang);
        expect(getSearchHistory().map(item => item.query)).toEqual(["new"]);
        for (let i = 0; i < 505; i++) addToSearchHistory(String(i), bang);
        expect(getSearchHistory()).toHaveLength(500);
    });
    test("blocked storage does not interrupt searches", () => {
        Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("blocked"); } });
        expect(getSearchHistory()).toEqual([]);
        expect(() => addToSearchHistory("hello", { bang: "ddg", name: "DuckDuckGo", url: ddg.u })).not.toThrow();
    });
});
