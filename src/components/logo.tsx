/**
 * Het Outdoor Valley-logo als masker: het vlak krijgt de gewenste kleur via
 * `background`, zodat het het accent of crème volgt. Nooit de vulling
 * overschrijven met een andere kleur dan navy of crème, nooit kantelen of
 * vervormen. Ondergrens 52px voor het volledige logo, 18px voor het merkteken.
 */
const MASK = {
  volledig: "/brand/logo-ov.svg",
  merkteken: "/brand/logo-ov-mark.svg",
} as const;

export function Logo({
  variant = "volledig",
  size,
  className = "",
}: {
  variant?: keyof typeof MASK;
  /** Breedte in px — minimaal 52 voor het volledige logo, 18 voor het merkteken. */
  size: number;
  className?: string;
}) {
  const url = `url(${MASK[variant]})`;
  const hoogte = variant === "volledig" ? size : Math.round(size * (405.9 / 413));

  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: size,
        height: hoogte,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
