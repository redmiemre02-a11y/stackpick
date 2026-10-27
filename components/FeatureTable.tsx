import type { Category, Tool } from "@/lib/types";
import { formatUsd } from "@/lib/insights";
import ToolLogo from "@/components/ToolLogo";

export default function FeatureTable({ tools, category }: { tools: Tool[]; category: Category }) {
  return (
    <div className="table-wrap">
      <table className="features">
        <thead>
          <tr>
            <th>Feature</th>
            {tools.map((t) => (
              <th key={t.slug}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <ToolLogo tool={t} size={24} />
                  <span>{t.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Free plan</td>
            {tools.map((t) => (
              <td key={t.slug}>{t.pricing.free_plan ? "✅" : "❌"}</td>
            ))}
          </tr>
          <tr>
            <td>Starting price</td>
            {tools.map((t) => (
              <td key={t.slug}>
                {formatUsd(t.pricing.starting_price_usd)}
                <small>{t.pricing.billing === "per_seat" ? " /user/mo" : " /mo"}</small>
              </td>
            ))}
          </tr>
          {category.features.map((f) => {
            const vals = tools.map((t) => !!t.features[f.key]);
            const differs = vals.some((v) => v !== vals[0]);
            return (
              <tr key={f.key} className={differs ? "diff" : ""}>
                <td>{f.label}</td>
                {vals.map((v, i) => (
                  <td key={tools[i].slug}>{v ? "✅" : "—"}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted">Highlighted rows are where the tools differ.</p>
    </div>
  );
}
