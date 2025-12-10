export function ewma(
  values: number[],
  alpha: number
): number | null {
  if (!values.length) return null;
  let s = values[0];
  for (let i = 1; i < values.length; i++) {
    s = alpha * values[i] + (1 - alpha) * s;
  }
  return s;
}
