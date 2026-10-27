import type { Tool } from "@/lib/types";

interface Props {
  tool: Tool;
  size?: number;
  className?: string;
}

export default function ToolLogo({ tool, size = 40, className = "" }: Props) {
  let domain = "";
  try {
    domain = new URL(tool.website).hostname.replace(/^www\./, "");
  } catch {
    domain = `${tool.slug}.com`;
  }

  // Google Favicon API sz=128 gives crisp high-res brand icons for every domain
  const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  return (
    <div
      className={`tool-logo-box ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    >
      <img
        src={logoUrl}
        alt={`${tool.name} logo`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="tool-logo-img"
      />
    </div>
  );
}
