import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SleepSession } from '../../types/models';
import { formatMinutes } from '../../utils/format';
import dayjs from '../../utils/time';

interface Props {
  sessions: SleepSession[];
  loading: boolean;
  editingSessionId: string | null;
  onPressSession: (s: SleepSession) => void;
}

export const SessionsList: React.FC<Props> = ({
  sessions,
  loading,
  editingSessionId,
  onPressSession,
}) => {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Sessions</Text>
        {loading && <ActivityIndicator size="small" />}
      </View>

      {sessions.length === 0 ? (
        <Text style={styles.empty}>
          No sessions logged for this day.
        </Text>
      ) : (
        sessions.map((s) => {
          const start = dayjs(s.startISO);
          const end = dayjs(s.endISO);
          const durationMin = end.diff(start, 'minute');
          const qualityText =
            s.quality !== undefined ? `Q${s.quality}` : 'Q-';
          const isEditing = editingSessionId === s.id;

          return (
            <Pressable
              key={s.id}
              onPress={() => onPressSession(s)}
              style={[
                styles.item,
                isEditing && styles.itemActive,
              ]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={styles.time}>
                  {start.format('h:mm A')} - {end.format('h:mm A')}
                </Text>
                <Text style={styles.meta}>
                  {formatMinutes(durationMin)} • {qualityText}
                </Text>
              </View>
              {s.notes ? (
                <Text style={styles.notes} numberOfLines={1}>
                  {s.notes}
                </Text>
              ) : null}
              <Text style={styles.source}>
                {s.source === 'timer' ? 'Timer entry' : 'Manual entry'}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  empty: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  item: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  itemActive: {
    backgroundColor: '#e0f2fe',
  },
  time: { fontSize: 14, fontWeight: '500', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280' },
  notes: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  source: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
});
