import express from 'express';
import { getAccessToken, getCommodities } from './blizzard/auth';
import { summarise, type ItemSummary } from './blizzard/aggregate';
import { Response, Request } from 'express';
import { loadItemCaches, ensureNames, ensureIcons, getName, getIcon } from './blizzard/items';

const app = express();

let summary: ItemSummary[] = [];
let updatedAt: Date | null = null;

async function refresh() {
    try {
        const token = await getAccessToken();
        const data = await getCommodities(token);
        summary = summarise(data.auctions);
        const itemIds = summary.map((i) => i.itemId);
        await ensureNames(itemIds, token);
        await ensureIcons(itemIds, token);
        await ensureNames(summary.map((i) => i.itemId), token);
        const items = summary.map((i) => ({
            ...i,
            name: getName(i.itemId) ?? `Item ${i.itemId}`,
            icon: getIcon(i.itemId) ?? null,
        }));
        updatedAt = new Date();
        console.log(`Refreshed: ${summary.length} items`);
    } catch (err) {
        console.error('Refresh failed:', err);
    }
}

app.get('/api/commodities', (req: Request, res: Response) => {
    const items = summary.map((i) => ({
        ...i,
        name: getName(i.itemId) ?? `Item ${i.itemId}`,
        icon: getIcon(i.itemId) ?? null,
    }));
    res.json({ updatedAt, items });
});

await loadItemCaches();

app.listen(3000, () => console.log('Listening on port 3000'));
void refresh();
setInterval(refresh, 60 * 60 * 1000);