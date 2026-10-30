import { z } from 'zod';

export const TokenResponse = z.object({
    access_token: z.string(),
    expires_in: z.number(),
});

export type TokenResponse = z.infer<typeof TokenResponse>;

const CommodityAuction = z.object({
    item: z.object({ id: z.number() }),
    quantity: z.number(),
    unit_price: z.number(),
    time_left: z.enum(['SHORT', 'MEDIUM', 'LONG', 'VERY_LONG']),
})
.transform((a) => ({
    itemId: a.item.id,
    quantity: a.quantity,
    unitPrice: a.unit_price,
    timeLeft: a.time_left,
}));

export const CommoditiesResponse = z.object({
    auctions: z.array(CommodityAuction),
});

export type CommoditiesResponse = z.infer<typeof CommoditiesResponse>;