export function formatMinutes(mins: number): string {
  if (mins <= 0 || Number.isNaN(mins)) return '0 min';
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (hours === 0) return `${mins} min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}
