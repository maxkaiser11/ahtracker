import express from 'express';
import { getAccessToken, getCommodities } from './blizzard/auth';
import { summarise, type ItemSummary } from './blizzard/aggregate';
import { Response, Request } from 'express';
import { loadNameCache, ensureNames, getName } from './blizzard/items';

const app = express();

let summary: ItemSummary[] = [];
let updatedAt: Date | null = null;

async function refresh() {
    try {
        const token = await getAccessToken();
        const data = await getCommodities(token);
        summary = summarise(data.auctions);
        await ensureNames(summary.map((i) => i.itemId), token);
        updatedAt = new Date();
        console.log(`Refreshed: ${summary.length} items`);
    } catch (err) {
        console.error('Refresh failed:', err);
    }
}

app.get('/api/commodities', (req: Request, res: Response) => {
    const items = summary.map((i) => ({ ...i, name: getName(i.itemId) ?? `Item ${i.itemId}` }));
    res.json({ updatedAt, items });
});

await loadNameCache();
await refresh();
setInterval(refresh, 60 * 60 * 1000);

app.listen(3000, () => console.log('Listening on port 3000'));