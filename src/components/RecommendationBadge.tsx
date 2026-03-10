interface Props {
  recommendation: "BUY" | "SELL" | "HOLD";
  size?: "sm" | "md" | "lg";
}

const colors = {
  BUY:  "bg-green-500/20 text-green-400 border border-green-500/30",
  SELL: "bg-red-500/20 text-red-400 border border-red-500/30",
  HOLD: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

const labels = {
  BUY:  "買い",
  SELL: "売り",
  HOLD: "保有",
};

const sizes = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5 font-bold",
};

export default function RecommendationBadge({ recommendation, size = "md" }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${colors[recommendation]} ${sizes[size]}`}>
      {labels[recommendation]}
    </span>
  );
}
