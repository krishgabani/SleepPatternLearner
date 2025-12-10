import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ScheduleBlock } from '../../types/models';
import dayjs from '../../utils/time';

interface Props {
  wakeOffsetMin: number;
  onChangeOffset: (offset: number) => void;
  previewSchedule: ScheduleBlock[];
}

export const WhatIfScheduleSection: React.FC<Props> = ({
  wakeOffsetMin,
  onChangeOffset,
  previewSchedule,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Adjust wake window</Text>
        <Text style={styles.subtitle}>
          Offset: {wakeOffsetMin} min
        </Text>
      </View>

      <View style={styles.sliderRow}>
        <Slider
          style={{ flex: 1, height: 32 }}
          minimumValue={-30}
          maximumValue={30}
          step={5}
          value={wakeOffsetMin}
          onValueChange={onChangeOffset}
        />
      </View>

            {wakeOffsetMin === 0 ? (
        <Text style={styles.empty}>
          Move the slider to see how the next few blocks would shift
          (this won’t change your actual schedule).
        </Text>
      ) : previewSchedule.length === 0 ? (
        <Text style={styles.empty}>
          Not enough upcoming blocks to preview right now.
        </Text>
      ) : (
        previewSchedule.map((b) => {
          const start = dayjs(b.startISO);
          const end = dayjs(b.endISO);
          const labelKind =
            b.kind === 'nap'
              ? 'Nap'
              : b.kind === 'bedtime'
              ? 'Bedtime'
              : 'Wind-down';

          const pct = Math.round(b.confidence * 100);

          return (
            <View key={`whatif_${b.id}`} style={styles.item}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={styles.time}>
                  {start.format('ddd h:mm A')} -{' '}
                  {end.format('h:mm A')} · {labelKind}
                </Text>
                <Text style={styles.meta}>
                  {pct < 5 ? 'low data' : `${pct}% conf`}
                </Text>
              </View>
              <Text style={styles.rationale}>
                {b.rationale} (preview with offset {wakeOffsetMin}m)
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  empty: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  item: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  time: { fontSize: 13, fontWeight: '500', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280' },
  rationale: { fontSize: 11, color: '#6b7280', marginTop: 2 },
});
