const STATUS_MAP = {
  pending:     { label: 'Pending',     bg: 'bg-gray-500/20',    text: 'text-gray-400',   dot: 'bg-gray-400' },
  connecting:  { label: 'Connecting',  bg: 'bg-yellow-500/20',  text: 'text-yellow-400', dot: 'bg-yellow-400' },
  transferred: { label: 'Waiting',     bg: 'bg-cyan-500/20',  text: 'text-cyan-400', dot: 'bg-cyan-400' },
  opened:      { label: 'Delivered',   bg: 'bg-cyan-500/20',    text: 'text-cyan-400',   dot: 'bg-cyan-400' },
  completed:   { label: 'Read',        bg: 'bg-green-500/20',   text: 'text-green-400',  dot: 'bg-green-400' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
