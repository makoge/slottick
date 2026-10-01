// app/api/og/route.tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Parse query parameters
  const type = searchParams.get("type") || "profile"; // "service" | "profile" | "review"
  const title = searchParams.get("title") || "Slottick Verified Studio";
  const subtitle =
    searchParams.get("subtitle") || "Book live slots on Slottick";
  const tag = searchParams.get("tag") || "Verified Specialist";
  const city = searchParams.get("city") || "";
  const price = searchParams.get("price") || "";
  const rating = searchParams.get("rating") || "";
  const image = searchParams.get("image") || "";

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#090d16",
        padding: "60px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Soft background glows */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "rgba(163, 230, 53, 0.15)",
          filter: "blur(120px)",
        }}
      />

      {/* Top bar: Brand & Category Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              backgroundColor: "#bef264",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1a2e05",
            }}
          >
            ✓
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            Slottick
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: "rgba(190, 242, 100, 0.15)",
            border: "1px solid rgba(190, 242, 100, 0.4)",
            borderRadius: "9999px",
          }}
        >
          <span
            style={{
              color: "#bef264",
              fontSize: "16px",
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            {tag}
          </span>
        </div>
      </div>

      {/* Middle Content: Main Card & Photos */}
      <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
        {/* Left Text */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {city ? (
            <span
              style={{
                color: "#94a3b8",
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              📍 {city}
            </span>
          ) : null}

          <h1
            style={{
              fontSize: title.length > 30 ? "46px" : "56px",
              fontWeight: "900",
              color: "#ffffff",
              lineHeight: "1.15",
              margin: "0 0 16px 0",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: "22px",
              color: "#94a3b8",
              lineHeight: "1.4",
              margin: 0,
            }}
          >
            {subtitle}
          </p>

          {/* Metrics (Rating or Price) */}
          <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
            {rating ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  color: "#facc15",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                ★ {rating}
              </div>
            ) : null}

            {price ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(190, 242, 100, 0.2)",
                  border: "1px solid rgba(190, 242, 100, 0.4)",
                  padding: "8px 18px",
                  borderRadius: "12px",
                  color: "#bef264",
                  fontSize: "20px",
                  fontWeight: "800",
                }}
              >
                {price}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Image (if provided) */}
        {image ? (
          <img
            src={image}
            alt=""
            style={{
              width: "320px",
              height: "320px",
              borderRadius: "28px",
              objectFit: "cover",
              border: "2px solid rgba(255, 255, 255, 0.15)",
            }}
          />
        ) : null}
      </div>

      {/* Footer info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "24px",
        }}
      >
        <span style={{ color: "#64748b", fontSize: "18px" }}>
          Real-time appointment schedule & instant booking
        </span>
        <span style={{ color: "#bef264", fontSize: "18px", fontWeight: "700" }}>
          slottick.com
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
