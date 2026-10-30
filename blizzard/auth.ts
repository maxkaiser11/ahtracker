import { writeFile } from 'fs/promises';
import {env} from '../config/env';

import { CommoditiesResponse, TokenResponse } from './schema';

async function getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${env.API_CLIENT}:${env.CLIENT_SECRET}`).toString('base64');

    const res = await fetch('https://oauth.battle.net/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);

    const data = TokenResponse.parse(await res.json());
    return data.access_token;
}

async function getCommodities(token: string): Promise<CommoditiesResponse> {
    const url = 'https://eu.api.blizzard.com/data/wow/auctions/commodities?namespace=dynamic-eu&locale=en_GB';

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`API request failed: ${res.status} ${await res.text()}`);

    return CommoditiesResponse.parse(await res.json());
}

async function main() {
    const token = await getAccessToken();
    const data = await getCommodities(token);

    await writeFile('commodities.json', JSON.stringify(data, null, 2));
    console.log('Saved to commodities.json');
}

main().catch(console.error);