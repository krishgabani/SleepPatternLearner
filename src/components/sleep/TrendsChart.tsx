import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient,
    Path,
    Stop,
    Text as SvgText,
} from "react-native-svg";
import { formatMinutes } from "../../utils/format";
import dayjs from "../../utils/time";

interface DailyTotal {
  date: string; // ISO
  totalMin: number;
}

interface Props {
  data: DailyTotal[];
}

// --- Smooth curve helper (Catmull-Rom → Cubic Bézier) ---
function buildSmoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

export const TrendsChart: React.FC<Props> = ({ data }) => {
  if (!data.length) return null;

  // convert minutes → hours
  const valuesHours = data.map((d) => d.totalMin / 60);
  const maxHours = Math.max(...valuesHours, 1);
  const width = 300;
  const height = 160;

  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, idx) => {
    const xStep = data.length === 1 ? 0 : chartWidth / (data.length - 1);
    const x = paddingLeft + idx * xStep;
    const value = d.totalMin / 60;
    const ratio = maxHours === 0 ? 0 : value / maxHours;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { x, y, value, dateISO: d.date };
  });

  // --- NEW: Smooth curved path ---
  const lineD = buildSmoothPath(points);

  const baselineY = paddingTop + chartHeight;
  const first = points[0];
  const last = points[points.length - 1];

  // Smooth area path
  const areaD = `
    ${lineD}
    L ${last.x} ${baselineY}
    L ${first.x} ${baselineY}
    Z
  `;

  // Y ticks
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const v = (maxHours * i) / tickCount;
    return v;
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Daily Sleep Duration</Text>
      <Text style={styles.subtitle}>
        Total sleep logged per day.
      </Text>

      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#38bdf8" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Y grid */}
        {ticks.map((t, idx) => {
          const ratio = maxHours === 0 ? 0 : t / maxHours;
          const y = paddingTop + chartHeight - ratio * chartHeight;
          return (
            <React.Fragment key={`tick-${idx}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 4}
                fontSize={10}
                fill="#6b7280"
                textAnchor="end"
              >
                {t.toFixed(1)}h
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Smooth area */}
        <Path d={areaD} fill="url(#sleepGradient)" />

        {/* Smooth curve line */}
        <Path d={lineD} stroke="#38bdf8" strokeWidth={2} fill="none" />

        {/* Points */}
        {points.map((p, idx) => (
          <Circle
            key={`pt-${idx}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#22c55e"
            stroke="#ffffff"
            strokeWidth={1}
          />
        ))}

        {/* X labels */}
        {/* X labels: Day + Number */}
        {points.map((p, idx) => {
          const d = dayjs(p.dateISO);
          return (
            <React.Fragment key={`x-${idx}`}>
              {/* Day name */}
              <SvgText
                x={p.x}
                y={baselineY + 16} // spacing below chart baseline
                fontSize={10}
                fill="#6b7280"
                textAnchor="middle"
              >
                {d.format("ddd")}
              </SvgText>

              {/* Day number */}
              <SvgText
                x={p.x}
                y={baselineY + 30} // number below day
                fontSize={10}
                fill="#9ca3af"
                textAnchor="middle"
              >
                {d.format("D")}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legendRow}>
        <Text style={styles.legendText}>
          Max day: {formatMinutes(maxHours * 60)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 8,
  },
  legendRow: {
    marginTop: 4,
  },
  legendText: {
    fontSize: 10,
    color: "#6b7280",
  },
});
