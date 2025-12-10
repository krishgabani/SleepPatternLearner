import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LearnerState } from '../../types/models';
import { formatMinutes } from '../../utils/format';

interface Props {
  dateLabel: string;
  totalSleepMin: number;
  learnerState: LearnerState | null;
  onPrevDay: () => void;
  onNextDay: () => void;
}

export const DayHeader: React.FC<Props> = ({
  dateLabel,
  totalSleepMin,
  learnerState,
  onPrevDay,
  onNextDay,
}) => {
  return (
    <View style={styles.row}>
      <Pressable style={styles.navBtn} onPress={onPrevDay}>
        <Text style={styles.navText}>‹</Text>
      </Pressable>

      <View style={{ alignItems: 'center' }}>
        <Text style={styles.title}>{dateLabel}</Text>
        <Text style={styles.subtitle}>Total sleep: {formatMinutes(totalSleepMin)}</Text>
        {learnerState && (
          <Text style={styles.subtitle}>
            Wake ~ {formatMinutes(Math.round(learnerState.ewmaWakeWindowMin))} · Nap ~{' '}
            {formatMinutes(Math.round(learnerState.ewmaNapLengthMin))} · Conf ~{' '}
            {Math.round(learnerState.confidence * 100)}%
          </Text>
        )}
      </View>

      <Pressable style={styles.navBtn} onPress={onNextDay}>
        <Text style={styles.navText}>›</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { fontSize: 20, color: '#111827' },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280' },
});
