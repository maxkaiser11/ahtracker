import { useEffect, useState } from 'react';

interface ItemSummary {
    itemId: number;
    name: string;
    minPrice: number;
    totalQuantity: number;
    listings: number;
    icon: string | null;
}

function Coin({ value, unit, color }: { value: string | number; unit: string; color: string }) {
    return (
        <span className="inline-flex items-center gap-1">
            <span>{value}</span>
            <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />
            <span className="sr-only">{unit}</span>
        </span>
    );
}

function Price({ copper }: { copper: number }) {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const remainder = copper % 100;

    return (
        <span className="inline-flex items-center justify-end gap-2.5 font-medium text-zinc-100">
            {gold > 0 && <Coin value={gold.toLocaleString()} unit="gold" color="bg-amber-400" />}
            {silver > 0 && <Coin value={silver} unit="silver" color="bg-zinc-300" />}
            {(remainder > 0 || copper === 0) && (
                <Coin value={remainder} unit="copper" color="bg-orange-700" />
            )}
        </span>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <p className="text-xs font-medium text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums">
                {value}
            </p>
        </div>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
            <div
                className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.16),transparent_65%)]"
                aria-hidden="true"
            />
            <main className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">{children}</main>
        </div>
    );
}

export default function App() {
    const [items, setItems] = useState<ItemSummary[]>([]);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/commodities')
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setItems(data.items);
                setUpdatedAt(data.updatedAt);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Shell>
                <div className="animate-pulse space-y-3" aria-label="Loading items">
                    <div className="mb-10 h-12 w-2/3 rounded-xl bg-white/5" />
                    {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-white/5" />
                    ))}
                </div>
            </Shell>
        );
    }

    if (error) {
        return (
            <Shell>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
                    <h1 className="font-semibold text-red-300">Couldn't load items</h1>
                    <p className="mt-1 text-sm text-red-200/70">{error}</p>
                </div>
            </Shell>
        );
    }

    const query = search.trim().toLowerCase();
    const matches = items.filter((i) => (i.name ?? '').toLowerCase().includes(query));
    const visible = matches.slice(0, 100);
    const totalUnits = items.reduce((sum, i) => sum + i.totalQuantity, 0);
    const updatedLabel = updatedAt
        ? new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Refreshing…';

    return (
        <Shell>
            <header>
                <p className="text-sm font-medium text-amber-400">EU commodities</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                    Auction House Tracker
                </h1>
                <p className="mt-4 max-w-xl text-zinc-400">
                    Lowest prices and available supply across the European auction house.
                </p>
            </header>

            <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Market summary">
                <Stat label="Items tracked" value={items.length.toLocaleString()} />
                <Stat label="Units listed" value={totalUnits.toLocaleString()} />
                <Stat label="Last updated" value={updatedLabel} />
            </section>

            <div className="sticky top-0 z-10 -mx-4 mt-8 bg-zinc-950/85 px-4 py-3 backdrop-blur-lg sm:mx-0 sm:px-0">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <svg
                            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                        </svg>
                        <input
                            type="search"
                            placeholder="Search items…"
                            aria-label="Search items"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 pr-4 pl-11 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-4 focus:ring-amber-400/10"
                        />
                    </div>
                    <p className="hidden shrink-0 text-sm text-zinc-500 tabular-nums sm:block">
                        {visible.length.toLocaleString()} of {matches.length.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
                <table className="w-full text-left">
                    <thead className="border-b border-white/10 text-xs font-medium text-zinc-500">
                        <tr>
                            <th className="hidden w-14 px-5 py-3 font-medium sm:table-cell">#</th>
                            <th className="px-4 py-3 font-medium sm:px-5">Item</th>
                            <th className="px-4 py-3 text-right font-medium sm:px-5">Min price</th>
                            <th className="px-4 py-3 text-right font-medium sm:px-5">Quantity</th>
                            <th className="hidden px-5 py-3 text-right font-medium md:table-cell">Listings</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {visible.map((i, index) => (
                            <tr key={i.itemId} className="group transition-colors hover:bg-white/[0.04]">
                                <td className="hidden px-5 py-3 text-sm text-zinc-600 tabular-nums sm:table-cell">
                                    {index + 1}
                                </td>
                                <td className="px-4 py-3 sm:px-5">
                                    <div className="flex items-center gap-3">
                                        {i.icon ? (
                                            <img
                                                src={i.icon}
                                                alt=""
                                                width={40}
                                                height={40}
                                                loading="lazy"
                                                className="size-10 shrink-0 rounded-lg ring-1 ring-white/15 transition group-hover:ring-amber-400/60"
                                            />
                                        ) : (
                                            <div className="size-10 shrink-0 rounded-lg bg-white/5 ring-1 ring-white/10" />
                                        )}
                                        <span className="font-medium text-zinc-100">{i.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums sm:px-5">
                                    <Price copper={i.minPrice} />
                                </td>
                                <td className="px-4 py-3 text-right text-zinc-300 tabular-nums sm:px-5">
                                    {i.totalQuantity.toLocaleString()}
                                </td>
                                <td className="hidden px-5 py-3 text-right text-zinc-500 tabular-nums md:table-cell">
                                    {i.listings.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {visible.length === 0 && (
                    <div className="px-6 py-16 text-center">
                        <p className="font-medium text-zinc-300">No items found</p>
                        <p className="mt-1 text-sm text-zinc-500">Try searching for something else.</p>
                    </div>
                )}
            </div>
        </Shell>
    );
}