import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NotificationPlan } from '../../notifications';
import dayjs from '../../utils/time';

dayjs.extend(relativeTime);

interface Props {
  entries: NotificationPlan[];
}

export const NotificationLog: React.FC<Props> = ({ entries }) => {
  if (!entries.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Notification log</Text>
        <Text style={styles.subtitle}>
          No notifications would be scheduled right now. Add some sleep
          sessions so I can generate upcoming nap/bedtime windows.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Notification log</Text>
      <Text style={styles.subtitle}>
        This mirrors the local notifications I would schedule for the
        next 36 hours.
      </Text>

      {entries.map((entry) => {
        const when = dayjs(entry.fireTimeISO);
        const rel = when.fromNow(); // e.g., "in 2 hours"
        const labelKind =
          entry.kind === 'nap'
            ? 'Nap'
            : entry.kind === 'bedtime'
            ? 'Bedtime'
            : 'Wind-down';

        return (
          <View key={entry.id} style={styles.item}>
            <View style={styles.rowBetween}>
              <Text style={styles.kindText}>{labelKind}</Text>
              <Text style={styles.timeText}>
                {when.format('ddd, DD MMM h:mm A')}
              </Text>
            </View>
            <Text style={styles.relText}>{rel}</Text>
            <Text style={styles.bodyText}>{entry.title}</Text>
            <Text style={styles.bodySubText}>{entry.body}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
  },
  item: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kindText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  timeText: {
    fontSize: 12,
    color: '#4b5563',
  },
  relText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 12,
    color: '#111827',
  },
  bodySubText: {
    fontSize: 11,
    color: '#6b7280',
  },
});
