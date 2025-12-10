import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import type { SleepSession } from '../../types/models';

interface Props {
  open: boolean;
  onToggle: () => void;
  manualStartLabel: string;
  manualEndLabel: string;
  onPressStartPicker: () => void;
  onPressEndPicker: () => void;
  quality: SleepSession['quality'];
  onChangeQuality: (q: SleepSession['quality']) => void;
  notes: string;
  onChangeNotes: (n: string) => void;
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
}

export const ManualEntryForm: React.FC<Props> = ({
  open,
  onToggle,
  manualStartLabel,
  manualEndLabel,
  onPressStartPicker,
  onPressEndPicker,
  quality,
  onChangeQuality,
  notes,
  onChangeNotes,
  onSave,
  saving,
  disabled,
}) => {
  return (
    <>
      <Pressable
        style={styles.toggle}
        onPress={onToggle}
        disabled={disabled}
      >
        <Text style={styles.toggleText}>
          {open ? 'Hide manual entry' : 'Add manual sleep'}
        </Text>
      </Pressable>

      {open && (
        <View style={styles.card}>
          <Text style={styles.title}>Manual session</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Start</Text>
            <Pressable style={styles.chip} onPress={onPressStartPicker}>
              <Text style={styles.chipText}>{manualStartLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>End</Text>
            <Pressable style={styles.chip} onPress={onPressEndPicker}>
              <Text style={styles.chipText}>{manualEndLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Quality</Text>
            <View style={styles.qualityRow}>
              {[1, 2, 3, 4, 5].map((q) => (
                <Pressable
                  key={q}
                  style={[
                    styles.qualityChip,
                    quality === q && styles.qualityChipActive,
                  ]}
                  onPress={() =>
                    onChangeQuality(q as SleepSession['quality'])
                  }
                >
                  <Text
                    style={[
                      styles.qualityChipText,
                      quality === q && styles.qualityChipTextActive,
                    ]}
                  >
                    {q}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={onChangeNotes}
            placeholder="E.g., very fussy, needed rocking"
            multiline
          />

          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={onSave}
            disabled={disabled}
          >
            {saving ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Save manual session</Text>
            )}
          </Pressable>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  toggle: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    marginBottom: 8,
  },
  toggleText: { fontSize: 12, color: '#374151' },
  card: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: { fontSize: 13, color: '#4b5563', marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  chipText: { fontSize: 13, color: '#111827' },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  qualityChipText: { fontSize: 13, color: '#4b5563' },
  qualityChipTextActive: { color: '#f9fafb', fontWeight: '600' },
  notesInput: {
    minHeight: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: '#f9fafb',
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 160,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 15,
  },
});
