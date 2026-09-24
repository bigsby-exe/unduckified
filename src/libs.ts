import { CONSTANTS } from "./constants.ts";

const createAudio = (src: string) => {
	const audio = new Audio();
	audio.src = src;
	return audio;
};

const storage = {
    get: (key: string): string | null => {
        try { return localStorage.getItem(key); } catch { return null; }
    },
    set: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch { /* Storage may be disabled or full. */ }
    },
    remove: (key: string) => {
        try { localStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
    },
};

function addToSearchHistory(
	query: string,
	bang: { bang: string; name: string; url: string },
) {
	const history = getSearchHistory();
	if (!history) return;

	history.unshift({
		query,
		bang: bang.bang,
		name: bang.name,
		timestamp: Date.now(),
	});
	history.splice(CONSTANTS.MAX_HISTORY);
	storage.set(
		CONSTANTS.LOCAL_STORAGE_KEYS.SEARCH_HISTORY,
		JSON.stringify(history),
	);
}

function getSearchHistory(): Array<{
	query: string;
	bang: string;
	name: string;
	timestamp: number;
}> {
	try {
		const value: unknown = JSON.parse(storage.get(CONSTANTS.LOCAL_STORAGE_KEYS.SEARCH_HISTORY) || "[]");
        if (!Array.isArray(value)) return [];
        return value.filter((entry) => entry && typeof entry === "object" &&
            typeof entry.query === "string" && typeof entry.bang === "string" &&
            typeof entry.name === "string" && typeof entry.timestamp === "number" &&
            Number.isFinite(entry.timestamp)).slice(0, CONSTANTS.MAX_HISTORY);
	} catch {
		return [];
	}
}

function clearSearchHistory() {
	storage.set(CONSTANTS.LOCAL_STORAGE_KEYS.SEARCH_HISTORY, "[]");
}

export {
	createAudio,
	storage,
	addToSearchHistory,
	getSearchHistory,
	clearSearchHistory,
};
