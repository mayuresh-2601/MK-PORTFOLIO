import CountUp from "./CountUp";

const DEFAULT_STATS = [
  { end: 12, suffix: "+", label: "Projects Shipped" },
  { end: 18, suffix: "+", label: "Technologies Used" },
  { end: 6, suffix: "+", label: "Certifications" },
  { end: 3, suffix: "+", label: "Years Building" },
];

export default function StatsBand({ stats = DEFAULT_STATS }) {
  return (
    <section className="band stats-band grid-dark" aria-label="At a glance">
      <div className="stats-band__inner">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <div className="stat__value">
              <CountUp end={stat.end} suffix={stat.suffix} />
            </div>
            <div className="stat__label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
