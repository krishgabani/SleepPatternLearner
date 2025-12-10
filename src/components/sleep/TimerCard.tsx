import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface Props {
  elapsedLabel: string;
  error: string | null;
  isTiming: boolean;
  saving: boolean;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const TimerCard: React.FC<Props> = ({
  elapsedLabel,
  error,
  isTiming,
  saving,
  disabled,
  onStart,
  onStop,
}) => {
  const handlePress = () => {
    if (isTiming) onStop();
    else onStart();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Current session</Text>
      <Text style={styles.value}>{elapsedLabel}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[
          styles.button,
          isTiming ? styles.buttonStop : styles.buttonStart,
        ]}
        onPress={handlePress}
        disabled={disabled}
      >
        {saving ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>
            {isTiming ? 'Stop & Save' : 'Start Sleep Timer'}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: { fontSize: 13, color: '#9ca3af' },
  value: {
    fontSize: 36,
    fontVariant: ['tabular-nums'],
    color: '#f9fafb',
    marginVertical: 4,
  },
  error: { fontSize: 13, color: '#fca5a5' },
  button: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: '#22c55e',
  },
  buttonStop: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 15,
  },
});
