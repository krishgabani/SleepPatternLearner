import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CoachInsight } from '../../types/models';

interface Props {
  insights: CoachInsight[];
}

export const CoachPanel: React.FC<Props> = ({ insights }) => {
  if (!insights.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Coach</Text>
      {insights.map((insight) => (
        <View
          key={insight.id}
          style={[
            styles.card,
            insight.severity === 'warn' && styles.cardWarn,
            insight.severity === 'alert' && styles.cardAlert,
            insight.severity === 'tip' && styles.cardTip,
          ]}
        >
          <Text style={styles.title}>{insight.title}</Text>
          <Text style={styles.message}>{insight.message}</Text>
          {insight.tags && insight.tags.length > 0 && (
            <Text style={styles.tags}>
              {insight.tags.map((t) => `#${t}`).join('  ')}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  card: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    marginBottom: 8,
  },
  cardTip: {
    backgroundColor: '#dbeafe',
  },
  cardWarn: {
    backgroundColor: '#fee2e2',
  },
  cardAlert: {
    backgroundColor: '#fecaca',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#374151',
  },
  tags: {
    marginTop: 4,
    fontSize: 11,
    color: '#6b7280',
  },
});
