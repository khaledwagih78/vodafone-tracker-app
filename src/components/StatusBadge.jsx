const EMOJI = {
  red: "🔴",
  warning: "⚠️",
  green: "✅",
};

export default function StatusBadge({ color }) {
  return <span className={`badge badge-${color}`}>{EMOJI[color] || ""}</span>;
}
