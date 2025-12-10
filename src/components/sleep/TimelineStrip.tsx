import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface HourSleep {
  hour: number;
  sleptMinutes: number;
}

interface Props {
  sleepByHour: HourSleep[];
}

export const TimelineStrip: React.FC<Props> = ({ sleepByHour }) => {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {sleepByHour.map(({ hour, sleptMinutes }) => (
          <View
            key={hour}
            style={[
              styles.hourBlock,
              sleptMinutes > 0 && styles.hourBlockSleep,
            ]}
          >
            {hour % 3 === 0 && (
              <Text style={styles.hourLabel}>{hour}</Text>
            )}
          </View>
        ))}
      </View>
      <Text style={styles.hint}>
        Shaded blocks indicate hours with sleep on this day.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  hourBlock: {
    flex: 1,
    height: 24,
    marginHorizontal: 1,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hourBlockSleep: {
    backgroundColor: '#38bdf8',
  },
  hourLabel: {
    fontSize: 8,
    color: '#0f172a',
    marginBottom: 2,
  },
  hint: {
    marginTop: 4,
    fontSize: 10,
    color: '#6b7280',
  },
});
