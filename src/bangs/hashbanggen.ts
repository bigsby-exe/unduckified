import rawBangs from "./bangs.json" with { type: "json" };

// Developer script that converts ./bang.ts' array to hashmap.

import type { Bang } from "../security.ts";

const hashbang: Record<string, Bang> = {
	p: {
		c: "AI",
		d: "https://perplexica.home.ecorp.dev",
		r: 0,
		s: "Perplexica",
		sc: "AI",
		t: "p",
		u: "https://perplexica.home.ecorp.dev/?q={{{s}}}",
	},
	se: {
		c: "Online Services",
		d: "https://search.ecorp.dev",
		r: 0,
		s: "SearXNG",
		sc: "Search",
		t: "se",
		u: "https://search.ecorp.dev/search?q={{{s}}}",
	},
	ai: {
		c: "Online Services",
		d: "https://ai.ecorp.dev",
		r: 0,
		s: "Open WebUI",
		sc: "Search",
		t: "ai",
		u: "https://ai.ecorp.dev/?q={{{s}}}",
	},
};
if (!Array.isArray(rawBangs) || rawBangs.length === 0) throw new Error("Empty or invalid bang catalog");
const combined = Object.create(null) as typeof hashbang;
for (const bang of rawBangs) {
    if (!bang || typeof bang.t !== "string" || !bang.t ||
        typeof bang.s !== "string" || typeof bang.d !== "string" || typeof bang.u !== "string") {
        throw new Error("Invalid bang entry");
    }
    combined[bang.t] = { t: bang.t, s: bang.s, d: bang.d, u: bang.u };
}
// Keep this fork's explicit overrides when upstream defines the same shortcut.
Object.assign(combined, hashbang);

await Bun.write(
	"./src/bangs/hashbang.ts",
    `import type { Bang } from "../security.ts";\nexport const bangs: Record<string, Bang> = JSON.parse(${JSON.stringify(JSON.stringify(combined))});\n`,
);
