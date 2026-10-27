import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "StackPick - Data-Driven SaaS Comparisons";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          color: "white",
          padding: "40px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "36px",
            fontWeight: 800,
            color: "#818cf8",
            marginBottom: "24px",
          }}
        >
          <span>⚡</span>
          <span>StackPick</span>
        </div>

        <div
          style={{
            fontSize: "64px",
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: "960px",
            marginBottom: "24px",
          }}
        >
          Data-Driven SaaS Comparisons &amp; Honest Verdicts
        </div>

        <div
          style={{
            fontSize: "26px",
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Compare software features, transparent pricing models, and team tiers side-by-side.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
