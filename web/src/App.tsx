import { useEffect, useState } from 'react';

interface ItemSummary {
    itemId: number;
    name: string;
    minPrice: number;
    totalQuantity: number;
    listings: number;
}

function formatGold(copper: number) {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    return `${gold.toLocaleString()}g ${silver}s`;
}

export default function App() {
    const [items, setItems] = useState<ItemSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/commodities')
            .then((res) => res.json())
            .then((data) => setItems(data.items))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading…</p>;

    const filtered = items
        .filter((i) => (i.name ?? '').toLowerCase().includes(search.toLowerCase()))
        .slice(0, 100);

    return (
        <div>
            <input
                placeholder="Search items…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <table>
                <thead>
                    <tr><th>Item</th><th>Min price</th><th>Quantity</th><th>Listings</th></tr>
                </thead>
                <tbody>
                    {filtered.map((i) => (
                        <tr key={i.itemId}>
                            <td>{i.name}</td>
                            <td>{formatGold(i.minPrice)}</td>
                            <td>{i.totalQuantity.toLocaleString()}</td>
                            <td>{i.listings}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}