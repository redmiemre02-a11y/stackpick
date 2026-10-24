"use client";

import { useState } from "react";

interface Item {
  name: string;
  slug: string;
  price: number | null;
  billing: "per_seat" | "flat";
}

/** Micro-tool: monthly + yearly cost for a given team size. Increases dwell time. */
export default function CostCalculator({ items }: { items: Item[] }) {
  const [seats, setSeats] = useState(5);
  const rows = items.map((it) => {
    const monthly = it.price == null ? null : it.billing === "per_seat" ? it.price * seats : it.price;
    return { ...it, monthly };
  });
  const priced = rows.filter((r) => r.monthly != null) as (Item & { monthly: number })[];
  const cheapest = priced.length ? Math.min(...priced.map((r) => r.monthly)) : null;

  return (
    <div className="card calc">
      <h3>Cost calculator</h3>
      <label htmlFor="seats">
        Team size: <strong>{seats}</strong> {seats === 1 ? "user" : "users"}
      </label>
      <input
        id="seats"
        type="range"
        min={1}
        max={100}
        value={seats}
        onChange={(e) => setSeats(Number(e.target.value))}
      />
      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>Monthly</th>
            <th>Yearly</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slug} className={r.monthly != null && r.monthly === cheapest ? "win" : ""}>
              <td>
                {r.name}
                <small> · {r.billing === "per_seat" ? "per user" : "flat"}</small>
              </td>
              <td>{r.monthly == null ? "Custom" : `$${r.monthly.toFixed(2)}`}</td>
              <td>{r.monthly == null ? "Custom" : `$${(r.monthly * 12).toFixed(0)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Based on entry-level paid plans. Prices change, so check the vendor before you buy.</p>
    </div>
  );
}
