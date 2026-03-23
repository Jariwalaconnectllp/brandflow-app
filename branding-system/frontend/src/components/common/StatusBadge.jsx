import { getStatusConfig, getPriorityConfig } from '../../utils/statusHelpers';

export function StatusBadge({ status, size = 'md' }) {
  const conf = getStatusConfig(status);
  return (
    <span className="badge" style={{
      background: conf.bg,
      color: conf.color,
      fontSize: size === 'sm' ? '10px' : '11px',
      padding: size === 'sm' ? '2px 8px' : '3px 10px'
    }}>
      {conf.icon} {conf.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const conf = getPriorityConfig(priority);
  return (
    <span className="badge" style={{ background: conf.bg, color: conf.color }}>
      {conf.label}
    </span>
  );
}
