import type { CommoditiesResponse } from './schema';

export interface ItemSummary {
    itemId: number;
    minPrice: number;      // copper
    totalQuantity: number;
    listings: number;
}

export function summarise(auctions: CommoditiesResponse['auctions']): ItemSummary[] {
    const byItem = new Map<number, ItemSummary>();

    for (const a of auctions) {
        const s = byItem.get(a.itemId);
        if (!s) {
            byItem.set(a.itemId, {
                itemId: a.itemId,
                minPrice: a.unitPrice,
                totalQuantity: a.quantity,
                listings: 1,
            });
        } else {
            s.minPrice = Math.min(s.minPrice, a.unitPrice);
            s.totalQuantity += a.quantity;
            s.listings++;
        }
    }

    return [...byItem.values()].sort((a, b) => b.totalQuantity - a.totalQuantity);
}