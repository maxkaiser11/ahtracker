import { readFile, writeFile } from 'fs/promises';
import { ItemResponse } from './schema';

const CACHE_FILE = 'item-names.json';
let names: Record<number, string> = {};

export async function loadNameCache() {
    try {
        names = JSON.parse(await readFile(CACHE_FILE, 'utf8'));
    } catch {
        names = {}; // first run, no file yet
    }
}

export function getName(itemId: number): string | undefined {
    return names[itemId];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchItemName(itemId: number, token: string, attempt = 1): Promise<string | null> {
    const url = `https://eu.api.blizzard.com/data/wow/item/${itemId}?namespace=static-eu&locale=en_GB`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (res.status === 429 && attempt <= 3) {
        await sleep(1000 * attempt); // back off: 1s, 2s, 3s
        return fetchItemName(itemId, token, attempt + 1);
    }

    if (!res.ok) {
        console.warn(`Item ${itemId}: HTTP ${res.status}`);
        return null;
    }

    const result = ItemResponse.safeParse(await res.json());
    if (!result.success) {
        console.warn(`Item ${itemId}: unexpected shape`, result.error.issues);
        return null;
    }
    return result.data.name;
}

export async function ensureNames(itemIds: number[], token: string) {
    const missing = itemIds.filter((id) => !(id in names));
    if (missing.length === 0) return;

    console.log(`Fetching ${missing.length} item names...`);

    const BATCH = 20;
    for (let i = 0; i < missing.length; i += BATCH) {
        const batch = missing.slice(i, i + BATCH);
        const results = await Promise.all(batch.map((id) => fetchItemName(id, token)));
        batch.forEach((id, j) => {
            if (results[j]) names[id] = results[j]!;
        });

        // save progress every 500 items so a crash doesn't lose everything
        if (i % 500 === 0) {
            await writeFile(CACHE_FILE, JSON.stringify(names));
            console.log(`  ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
        }

        await sleep(400); // 20 requests per 400ms is about 50/s, half the limit
    }

    await writeFile(CACHE_FILE, JSON.stringify(names));
    console.log(`Item names cached (${Object.keys(names).length} total)`);
}