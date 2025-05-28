import rawBangs from "./bangs.json" with { type: "json" };

// Developer script that converts ./bang.ts' array to hashmap.

const hashbang: {
	[key: string]: {
		c?: string;
		d: string;
		r: number;
		s: string;
		sc?: string;
		t: string;
		u: string;
	};
} = {
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
for (const bang of rawBangs) hashbang[bang.t] = bang;

Bun.write(
	"./src/bangs/hashbang.ts",
	`export const bangs: {[key: string]: ({c?:string, d: string, r: number, s:string, sc?: string, t: string, u: string })} = ${JSON.stringify(hashbang)};`,
);
