import Link from "next/link";

export default function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={it.path}>
          {i < items.length - 1 ? <Link href={it.path}>{it.name}</Link> : <span>{it.name}</span>}
          {i < items.length - 1 && " / "}
        </span>
      ))}
    </nav>
  );
}
