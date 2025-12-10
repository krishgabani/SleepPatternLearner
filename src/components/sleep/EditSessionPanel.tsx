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
  editingSession: SleepSession | null;
  editStartLabel: string;
  editEndLabel: string;
  onPressStartPicker: () => void;
  onPressEndPicker: () => void;
  quality: SleepSession['quality'];
  onChangeQuality: (q: SleepSession['quality']) => void;
  notes: string;
  onChangeNotes: (n: string) => void;
  confirmDeleteId: string | null;
  onCancel: () => void;
  onDelete: () => void;
  onSave: () => void;
  saving: boolean;
}

export const EditSessionPanel: React.FC<Props> = ({
  editingSession,
  editStartLabel,
  editEndLabel,
  onPressStartPicker,
  onPressEndPicker,
  quality,
  onChangeQuality,
  notes,
  onChangeNotes,
  confirmDeleteId,
  onCancel,
  onDelete,
  onSave,
  saving,
}) => {
  if (!editingSession) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Edit session</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Start</Text>
        <Pressable style={styles.chip} onPress={onPressStartPicker}>
          <Text style={styles.chipText}>{editStartLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>End</Text>
        <Pressable style={styles.chip} onPress={onPressEndPicker}>
          <Text style={styles.chipText}>{editEndLabel}</Text>
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

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={onChangeNotes}
        placeholder="Update notes"
        multiline
      />

      <View style={styles.buttonsRow}>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={styles.buttonSecondaryText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonDanger]}
          onPress={onDelete}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {confirmDeleteId === editingSession.id
              ? 'Tap again to delete'
              : 'Delete'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonPrimary]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Save</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
  },
  buttonSecondary: {
    backgroundColor: '#e5e7eb',
  },
  buttonDanger: {
    backgroundColor: '#b91c1c',
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonSecondaryText: {
    color: '#111827',
    fontWeight: '500',
    fontSize: 14,
  },
});
