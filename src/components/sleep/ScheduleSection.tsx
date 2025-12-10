import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ScheduleBlock } from '../../types/models';
import dayjs from '../../utils/time';

interface Props {
  upcomingSchedule: ScheduleBlock[];
}

export const ScheduleSection: React.FC<Props> = ({
  upcomingSchedule,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Upcoming schedule (today & tomorrow)
      </Text>

      {upcomingSchedule.length === 0 ? (
        <Text style={styles.empty}>
          No upcoming blocks yet - add a few days of logs to let me learn.
        </Text>
      ) : (
        upcomingSchedule.map((b) => {
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
            <View key={b.id} style={styles.item}>
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
              <Text style={styles.rationale}>{b.rationale}</Text>
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
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  empty: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  item: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  time: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
  rationale: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});
