import { useRouter } from "next/router";

export default function Custom404() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <h1 style={{ fontSize: 72, fontWeight: 900, color: "#0ea5e9", marginBottom: 0 }}>404</h1>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Page not found</h2>
      <p style={{ marginBottom: 32, color: "#64748b" }}>
        Sorry, the page you are looking for does not exist.<br />
        You can return to the homepage.
      </p>
      <button
        onClick={() => router.push("/")}
        style={{
          background: "#0ea5e9",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "12px 32px",
          fontSize: 18,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)"
        }}
      >
        Go to Home
      </button>
    </div>
  );
} 