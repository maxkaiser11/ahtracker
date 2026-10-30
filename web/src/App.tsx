import { useEffect, useState } from 'react';

interface ItemSummary {
    itemId: number;
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

    useEffect(() => {
        fetch('/api/commodities')
            .then((res) => res.json())
            .then((data) => setItems(data.items))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading…</p>;

    return (
        <table>
            <thead>
                <tr><th>Item ID</th><th>Min price</th><th>Quantity</th><th>Listings</th></tr>
            </thead>
            <tbody>
                {items.slice(0, 100).map((i) => (
                    <tr key={i.itemId}>
                        <td>{i.itemId}</td>
                        <td>{formatGold(i.minPrice)}</td>
                        <td>{i.totalQuantity.toLocaleString()}</td>
                        <td>{i.listings}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}