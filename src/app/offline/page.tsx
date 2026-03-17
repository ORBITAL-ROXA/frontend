"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {/* Glow ring icon */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "3px solid #A855F7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "2rem",
          boxShadow: "0 0 30px 6px rgba(168,85,247,0.4)",
        }}
      >
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: "#A855F7",
            letterSpacing: "0.05em",
          }}
        >
          OR
        </span>
      </div>

      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "#A855F7",
          marginBottom: "1rem",
          letterSpacing: "0.1em",
        }}
      >
        SEM CONEXÃO
      </h1>

      <p
        style={{
          fontSize: "1.1rem",
          color: "#A3A3A3",
          maxWidth: 400,
          lineHeight: 1.6,
          marginBottom: "2rem",
        }}
      >
        Você está offline. Verifique sua conexão com a internet e tente novamente.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: "transparent",
          color: "#A855F7",
          border: "2px solid #A855F7",
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          cursor: "pointer",
          borderRadius: 0,
          textTransform: "uppercase",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#A855F7";
          e.currentTarget.style.color = "#0A0A0A";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#A855F7";
        }}
      >
        Tentar Novamente
      </button>
    </div>
  );
}
