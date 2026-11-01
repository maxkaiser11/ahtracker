import { readFile, writeFile } from 'fs/promises';
import type { z } from 'zod';
import { ItemMediaResponse, ItemResponse } from './schema';

const NAME_CACHE_FILE = 'item-names.json';
const ICON_CACHE_FILE = 'item-icons.json';
const BATCH = 20;

type Cache = Record<number, string>;

let names: Cache = {};
let icons: Cache = {};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readCache(file: string): Promise<Cache> {
    try {
        return JSON.parse(await readFile(file, 'utf8'));
    } catch {
        return {}; // first run, no file yet
    }
}

export async function loadItemCaches() {
    [names, icons] = await Promise.all([
        readCache(NAME_CACHE_FILE),
        readCache(ICON_CACHE_FILE),
    ]);
}

export const getName = (itemId: number): string | undefined => names[itemId];
export const getIcon = (itemId: number): string | undefined => icons[itemId];

async function fetchParsed<T extends z.ZodTypeAny>(
    url: string,
    schema: T,
    token: string,
    label: string,
    attempt = 1,
): Promise<z.infer<T> | null> {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (res.status === 429 && attempt <= 3) {
        await sleep(1000 * attempt); // back off: 1s, 2s, 3s
        return fetchParsed(url, schema, token, label, attempt + 1);
    }

    if (!res.ok) {
        console.warn(`${label}: HTTP ${res.status}`);
        return null;
    }

    const result = schema.safeParse(await res.json());
    if (!result.success) {
        console.warn(`${label}: unexpected shape`, result.error.issues);
        return null;
    }
    return result.data;
}

async function fetchItemName(itemId: number, token: string): Promise<string | null> {
    const url = `https://eu.api.blizzard.com/data/wow/item/${itemId}?namespace=static-eu&locale=en_GB`;
    const data = await fetchParsed(url, ItemResponse, token, `Item ${itemId}`);
    return data?.name ?? null;
}

async function fetchItemIcon(itemId: number, token: string): Promise<string | null> {
    const url = `https://eu.api.blizzard.com/data/wow/media/item/${itemId}?namespace=static-eu`;
    const data = await fetchParsed(url, ItemMediaResponse, token, `Icon ${itemId}`);
    return data?.assets.find((a) => a.key === 'icon')?.value ?? null;
}

async function fillCache(
    cache: Cache,
    file: string,
    label: string,
    itemIds: number[],
    fetchValue: (id: number) => Promise<string | null>,
) {
    const missing = itemIds.filter((id) => !(id in cache));
    if (missing.length === 0) return;

    console.log(`Fetching ${missing.length} item ${label}...`);

    for (let i = 0; i < missing.length; i += BATCH) {
        const batch = missing.slice(i, i + BATCH);
        const results = await Promise.all(batch.map(fetchValue));

        batch.forEach((id, j) => {
            const value = results[j];
            if (value) cache[id] = value;
        });

        // save progress every 500 items so a crash doesn't lose everything
        if (i % 500 === 0) {
            await writeFile(file, JSON.stringify(cache));
            console.log(`  ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
        }

        await sleep(400); // 20 requests per 400ms is about 50/s, half the limit
    }

    await writeFile(file, JSON.stringify(cache));
    console.log(`Item ${label} cached (${Object.keys(cache).length} total)`);
}

export const ensureNames = (itemIds: number[], token: string) =>
    fillCache(names, NAME_CACHE_FILE, 'names', itemIds, (id) => fetchItemName(id, token));

export const ensureIcons = (itemIds: number[], token: string) =>
    fillCache(icons, ICON_CACHE_FILE, 'icons', itemIds, (id) => fetchItemIcon(id, token));