const DEFAULT_ITEMS = [
  "React",
  "Node.js",
  "Express",
  "MySQL",
  "REST APIs",
  "JWT Auth",
  "Docker",
  "Linux",
];

/**
 * Infinite CSS marquee. The track holds two identical chunks and slides by
 * 50%, so the loop is seamless. Pauses on hover; disabled by reduced motion
 * through index.css.
 */
export default function Marquee({ items = DEFAULT_ITEMS, label = "Core technologies" }) {
  const list = items.length > 0 ? items : DEFAULT_ITEMS;

  return (
    <div className="marquee" role="marquee" aria-label={label}>
      <div className="marquee__track">
        {[0, 1].map((chunk) => (
          <div className="marquee__chunk" key={chunk} aria-hidden={chunk === 1}>
            {list.map((item) => (
              <span key={`${chunk}-${item}`}>{item}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
