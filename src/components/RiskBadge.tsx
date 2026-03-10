interface Props {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

const colors = {
  LOW:    "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  MEDIUM: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  HIGH:   "bg-red-500/20 text-red-400 border border-red-500/30",
};

const labels = {
  LOW:    "低リスク",
  MEDIUM: "中リスク",
  HIGH:   "高リスク",
};

export default function RiskBadge({ riskLevel }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium ${colors[riskLevel]}`}>
      {labels[riskLevel]}
    </span>
  );
}
