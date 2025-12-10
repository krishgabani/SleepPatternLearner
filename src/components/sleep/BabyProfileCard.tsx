import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import type { BabyProfile } from '../../types/models';
import dayjs from '../../utils/time';

interface Props {
  profile: BabyProfile | null;
  loading: boolean;
  saving: boolean;
  onSaveProfile: (name: string, birthDateISO: string) => void;
}

export const BabyProfileCard: React.FC<Props> = ({
  profile,
  loading,
  saving,
  onSaveProfile,
}) => {
  const [editing, setEditing] = useState(!profile);
  const [name, setName] = useState(profile?.name ?? '');
  const [birthDate, setBirthDate] = useState<Date | null>(
    profile ? new Date(profile.birthDateISO) : null
  );
  const [showPicker, setShowPicker] = useState(false);

  // When profile changes (saved), sync local state and stop editing
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBirthDate(new Date(profile.birthDateISO));
      setEditing(false);
    }
  }, [profile]);

  const handleSave = () => {
    if (!name.trim() || !birthDate) return;
    onSaveProfile(name.trim(), birthDate.toISOString());
  };

  const renderAge = () => {
    if (!profile) return null;
    const birth = dayjs(profile.birthDateISO);
    const now = dayjs();
    const months = now.diff(birth, 'month');
    const days = now.diff(birth.add(months, 'month'), 'day');

    return (
      <Text style={styles.ageText}>
        Age: {months} mo{months === 1 ? '' : 's'}
        {days > 0 ? ` ${days}d` : ''}
      </Text>
    );
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Baby profile</Text>
        <Text style={styles.muted}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* <Text style={styles.title}>Baby profile</Text> */}

      {!editing && profile && (
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.nameText}>{profile.name}</Text>
            {renderAge()}
            <Text style={styles.muted}>
              Born {dayjs(profile.birthDateISO).format('DD MMM YYYY')}
            </Text>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>
      )}

      {editing && (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your baby’s name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Birth date</Text>
            <Pressable
              style={styles.dateChip}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.dateChipText}>
                {birthDate
                  ? dayjs(birthDate).format('DD MMM YYYY')
                  : 'Select date'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.actionsRow}>
            {profile && (
              <Pressable
                style={[styles.actionBtn, styles.actionSecondary]}
                onPress={() => {
                  setEditing(false);
                  if (profile) {
                    setName(profile.name);
                    setBirthDate(new Date(profile.birthDateISO));
                  }
                }}
                disabled={saving}
              >
                <Text style={styles.actionSecondaryText}>Cancel</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.actionPrimaryText}>
                {profile ? 'Save' : 'Create'}
              </Text>
            </Pressable>
          </View>

          <DateTimePickerModal
            isVisible={showPicker}
            mode="date"
            date={birthDate ?? new Date()}
            onConfirm={(date) => {
              setBirthDate(date);
              setShowPicker(false);
            }}
            onCancel={() => setShowPicker(false)}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  muted: { fontSize: 12, color: '#6b7280' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  ageText: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  editButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  editButtonText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  field: {
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: '#f9fafb',
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  dateChipText: { fontSize: 13, color: '#111827' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 80,
    alignItems: 'center',
  },
  actionPrimary: {
    backgroundColor: '#2563eb',
  },
  actionSecondary: {
    backgroundColor: '#e5e7eb',
  },
  actionPrimaryText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 13,
  },
  actionSecondaryText: {
    color: '#111827',
    fontWeight: '500',
    fontSize: 13,
  },
});
