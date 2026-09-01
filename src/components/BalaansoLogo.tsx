// Loggan enligt facit: svart B-märke + "alaanso" i display-serif.
export function BalaansoLogo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center" aria-label="Balaanso">
      <span
        aria-hidden
        className="inline-flex items-center justify-center"
        style={{
          width: size + 8,
          height: size + 8,
          background: "var(--ink)",
          color: "var(--paper)",
          fontFamily: "var(--font-display)",
          fontSize: size,
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        B
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: size,
          letterSpacing: 3,
          fontWeight: 400,
          marginLeft: 6,
        }}
      >
        alaanso
      </span>
    </span>
  );
}
