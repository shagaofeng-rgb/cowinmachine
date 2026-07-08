"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ fontFamily: "Arial, sans-serif", padding: 32 }}>
          <h1>Preview temporarily unavailable</h1>
          <p>The local mirror could not load the source site. Please try again.</p>
          <button onClick={() => reset()}>Retry</button>
        </main>
      </body>
    </html>
  );
}
