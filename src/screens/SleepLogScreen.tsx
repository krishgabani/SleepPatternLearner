import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { computeCoachInsights } from "../coach";
import { getActiveBabyProfile, initBabyProfileTable, upsertBabyProfile } from "../db/babyProfile";
import {
  getSessionsForDay,
  insertSleepSession,
  softDeleteSleepSession,
  updateSleepSession,
} from "../db/sleepSessions";
import { computeLearnerState } from "../learner";
import type { NotificationPlan } from '../notifications';
import {
  buildNotificationPlan,
} from '../notifications';
import { generateSchedule } from "../schedule";
import type {
  BabyProfile,
  CoachInsight,
  LearnerState,
  ScheduleBlock,
  SleepSession,
} from "../types/models";
import { createId } from "../utils/id";
import dayjs, { nowISO } from "../utils/time";

import { BabyProfileCard } from "../components/sleep/BabyProfileCard";
import { CoachPanel } from "../components/sleep/CoachPanel";
import { DayHeader } from "../components/sleep/DayHeader";
import { EditSessionPanel } from "../components/sleep/EditSessionPanel";
import { ManualEntryForm } from "../components/sleep/ManualEntryForm";
import { NotificationLog } from '../components/sleep/NotificationLog';
import { ScheduleSection } from "../components/sleep/ScheduleSection";
import { SessionsList } from "../components/sleep/SessionsList";
import { TimelineStrip } from "../components/sleep/TimelineStrip";
import { TimerCard } from "../components/sleep/TimerCard";
import { TrendsChart } from "../components/sleep/TrendsChart";
import { WhatIfScheduleSection } from "../components/sleep/WhatIfScheduleSection";


// TODO: replace with real baby profile later
const DEFAULT_BABY_BIRTHDATE = "2024-01-01";

export default function SleepLogScreen() {
  const db = useSQLiteContext();

  // Timer state
  const [isTiming, setIsTiming] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsedLabel, setElapsedLabel] = useState("00:00");
  const [savingTimer, setSavingTimer] = useState(false);

  // Manual entry state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualStart, setManualStart] = useState<Date | null>(null);
  const [manualEnd, setManualEnd] = useState<Date | null>(null);
  const [manualQuality, setManualQuality] =
    useState<SleepSession["quality"]>(3);
  const [manualNotes, setManualNotes] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  // Manual pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Edit session state
  const [editingSession, setEditingSession] = useState<SleepSession | null>(
    null
  );
  const [editStart, setEditStart] = useState<Date | null>(null);
  const [editEnd, setEditEnd] = useState<Date | null>(null);
  const [editQuality, setEditQuality] = useState<SleepSession["quality"]>(3);
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit pickers
  const [showEditStartPicker, setShowEditStartPicker] = useState(false);
  const [showEditEndPicker, setShowEditEndPicker] = useState(false);

  // Error
  const [error, setError] = useState<string | null>(null);

  // Selected day & sessions
  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Learner + schedule state
  const [learnerState, setLearnerState] = useState<LearnerState | null>(null);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);

  // What-if: wake window offset in minutes (-30..+30)
  const [wakeOffsetMin, setWakeOffsetMin] = useState(0);

  const [activeTab, setActiveTab] = useState<"today" | "insights" | "profile">(
    "today"
  );
  const [scheduleView, setScheduleView] = useState<"plan" | "whatif">("plan");

  const [coachInsights, setCoachInsights] = useState<CoachInsight[]>([]);

  const [babyProfile, setBabyProfile] = useState<BabyProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [weeklyTotals, setWeeklyTotals] = useState<
    { date: dayjs.Dayjs; totalMin: number }[]
  >([]);

  const [notificationPlan, setNotificationPlan] = useState<NotificationPlan[]>([]);

  // Load profile
  useEffect(() => {
    (async () => {
      try {
        await initBabyProfileTable(db);
        const profile = await getActiveBabyProfile(db);
        setBabyProfile(profile);
      } catch (e) {
        console.error("Failed to load baby profile", e);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [db]);

  // Live timer display
  useEffect(() => {
    if (!isTiming || !timerStart) {
      setElapsedLabel("00:00");
      return;
    }

    const update = () => {
      const diffMs = dayjs().diff(timerStart);
      const totalSec = Math.floor(diffMs / 1000);
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      const mm = String(minutes).padStart(2, "0");
      const ss = String(seconds).padStart(2, "0");
      setElapsedLabel(`${mm}:${ss}`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isTiming, timerStart]);

  useEffect(() => {
    (async () => {
      try {
        const days: dayjs.Dayjs[] = [];
        // 6 days before selected + selected day = 7 days total
        for (let i = 6; i >= 0; i--) {
          days.push(selectedDate.subtract(i, "day"));
        }

        const all = await Promise.all(
          days.map((d) => getSessionsForDay(db, d))
        );

        const totals = all.map((sessions, idx) => {
          const totalMin = sessions.reduce((sum, s) => {
            const start = dayjs(s.startISO);
            const end = dayjs(s.endISO);
            return sum + end.diff(start, "minute");
          }, 0);
          return { date: days[idx], totalMin };
        });

        setWeeklyTotals(totals);
      } catch (e) {
        console.error("Failed to compute weekly totals", e);
      }
    })();
  }, [db, selectedDate]);

  // Recompute learner + schedule when sessions change
  const recomputeLearnerAndSchedule = useCallback(
    (allSessions: SleepSession[], overrideBirthDateISO?: string) => {
      try {
        const birthDateISO =
          overrideBirthDateISO ??
          babyProfile?.birthDateISO ??
          DEFAULT_BABY_BIRTHDATE;

        const learner = computeLearnerState({
          birthDateISO,
          sessions: allSessions,
        });
        setLearnerState(learner);

        const schedule = generateSchedule({
          learnerState: learner,
          sessions: allSessions,
        });
        setScheduleBlocks(schedule);

        const plan = buildNotificationPlan(schedule);
        setNotificationPlan(plan);

        const insights = computeCoachInsights({
          sessions: allSessions,
          learnerState: learner,
        });
        setCoachInsights(insights);
      } catch (e) {
        console.error("Failed to compute learner/schedule/coach", e);
      }
    },
    [babyProfile]
  );

  // Load sessions for selected date
  const loadSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const data = await getSessionsForDay(db, selectedDate);
      setSessions(data);

      // For now, learner uses these sessions; later we can query last 14 days.
      recomputeLearnerAndSchedule(data);
    } catch (e) {
      console.error("Failed to load sessions", e);
      setError("Failed to load sessions.");
    } finally {
      setLoadingSessions(false);
    }
  }, [db, selectedDate, recomputeLearnerAndSchedule]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleStartTimer = () => {
    if (isTiming) return;
    setError(null);
    setTimerStart(new Date());
    setIsTiming(true);
  };

  const handleStopTimer = async () => {
    if (!isTiming || !timerStart) return;

    const end = new Date();
    if (end <= timerStart) {
      setError("End time must be after start time.");
      setIsTiming(false);
      setTimerStart(null);
      return;
    }

    const session: SleepSession = {
      id: createId("sess_"),
      startISO: dayjs(timerStart).toISOString(),
      endISO: dayjs(end).toISOString(),
      quality: 3,
      source: "timer",
      deleted: false,
      updatedAtISO: nowISO(),
    };

    try {
      setSavingTimer(true);
      setError(null);
      await insertSleepSession(db, session);
      await loadSessions();
      setIsTiming(false);
      setTimerStart(null);
    } catch (e) {
      console.error("Failed to save timer session", e);
      setError("Failed to save session. Check console for details.");
    } finally {
      setSavingTimer(false);
    }
  };

  const handleSaveManual = async () => {
    setError(null);

    if (!manualStart || !manualEnd) {
      setError("Please select both start and end time.");
      return;
    }

    if (manualEnd <= manualStart) {
      setError("End time must be after start time.");
      return;
    }

    const session: SleepSession = {
      id: createId("sess_"),
      startISO: dayjs(manualStart).toISOString(),
      endISO: dayjs(manualEnd).toISOString(),
      quality: manualQuality,
      notes: manualNotes.trim() || undefined,
      source: "manual",
      deleted: false,
      updatedAtISO: nowISO(),
    };

    try {
      setSavingManual(true);
      await insertSleepSession(db, session);
      await loadSessions();

      setManualStart(null);
      setManualEnd(null);
      setManualQuality(3);
      setManualNotes("");
      setManualOpen(false);
    } catch (e) {
      console.error("Failed to save manual session", e);
      setError("Failed to save manual session.");
    } finally {
      setSavingManual(false);
    }
  };

  const openEditSession = (session: SleepSession) => {
    setEditingSession(session);
    setEditStart(new Date(session.startISO));
    setEditEnd(new Date(session.endISO));
    setEditQuality(session.quality ?? 3);
    setEditNotes(session.notes ?? "");
    setConfirmDeleteId(null);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingSession || !editStart || !editEnd) {
      setError("Missing start or end time.");
      return;
    }

    if (editEnd <= editStart) {
      setError("End time must be after start time.");
      return;
    }

    const updated: SleepSession = {
      ...editingSession,
      startISO: dayjs(editStart).toISOString(),
      endISO: dayjs(editEnd).toISOString(),
      quality: editQuality,
      notes: editNotes.trim() || undefined,
      updatedAtISO: nowISO(),
    };

    try {
      setSavingEdit(true);
      await updateSleepSession(db, updated);
      await loadSessions();
      setEditingSession(null);
      setConfirmDeleteId(null);
    } catch (e) {
      console.error("Failed to update session", e);
      setError("Failed to update session.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteEdit = async () => {
    if (!editingSession) return;

    if (confirmDeleteId !== editingSession.id) {
      setConfirmDeleteId(editingSession.id);
      return;
    }

    try {
      setSavingEdit(true);
      await softDeleteSleepSession(db, editingSession.id);
      await loadSessions();
      setEditingSession(null);
      setConfirmDeleteId(null);
    } catch (e) {
      console.error("Failed to delete session", e);
      setError("Failed to delete session.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveBabyProfile = async (name: string, birthDateISO: string) => {
    try {
      setSavingProfile(true);
      const now = nowISO();

      let profile: BabyProfile;
      if (babyProfile) {
        profile = {
          ...babyProfile,
          name,
          birthDateISO,
          updatedAtISO: now,
        };
      } else {
        profile = {
          id: createId("baby_"),
          name,
          birthDateISO,
          createdAtISO: now,
          updatedAtISO: now,
        };
      }

      await upsertBabyProfile(db, profile);
      setBabyProfile(profile);

      // Recompute learner/schedule with the new birth date
      recomputeLearnerAndSchedule(sessions, birthDateISO);
    } catch (e) {
      console.error("Failed to save baby profile", e);
    } finally {
      setSavingProfile(false);
    }
  };

  const goPrevDay = () => {
    setSelectedDate((d) => d.subtract(1, "day"));
    setEditingSession(null);
    setConfirmDeleteId(null);
  };

  const goNextDay = () => {
    setSelectedDate((d) => d.add(1, "day"));
    setEditingSession(null);
    setConfirmDeleteId(null);
  };

  const totalSleepMin = useMemo(
    () =>
      sessions.reduce((sum, s) => {
        const start = dayjs(s.startISO);
        const end = dayjs(s.endISO);
        return sum + end.diff(start, "minute");
      }, 0),
    [sessions]
  );

  const sleepByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map((hour) => {
      const hourStart = selectedDate
        .hour(hour)
        .minute(0)
        .second(0)
        .millisecond(0);
      const hourEnd = hourStart.add(1, "hour");

      let sleptMinutes = 0;
      for (const s of sessions) {
        const sStart = dayjs(s.startISO);
        const sEnd = dayjs(s.endISO);
        const overlapStart = sStart.isAfter(hourStart) ? sStart : hourStart;
        const overlapEnd = sEnd.isBefore(hourEnd) ? sEnd : hourEnd;
        const diff = overlapEnd.diff(overlapStart, "minute");
        if (diff > 0) {
          sleptMinutes += diff;
        }
      }
      return { hour, sleptMinutes };
    });
  }, [selectedDate, sessions]);

  const now = dayjs();
  const upcomingSchedule = useMemo(
    () => scheduleBlocks.filter((b) => dayjs(b.endISO).isAfter(now)),
    [scheduleBlocks, now]
  );

  const previewSchedule = useMemo(() => {
    if (!learnerState) return [];
    const adjusted: LearnerState = {
      ...learnerState,
      ewmaWakeWindowMin: Math.max(
        30,
        learnerState.ewmaWakeWindowMin + wakeOffsetMin
      ),
    };

    return generateSchedule({
      learnerState: adjusted,
      sessions,
    }).filter((b) => dayjs(b.endISO).isAfter(now));
  }, [learnerState, wakeOffsetMin, sessions, now]);

  const anySaving = savingTimer || savingManual || savingEdit;

  const formatBabyAge = (birthDateISO: string): string => {
    const birth = dayjs(birthDateISO);
    const now = dayjs();
    const months = now.diff(birth, "month");
    const days = now.diff(birth.add(months, "month"), "day");
    if (months <= 0) return `${days}d`;
    return days > 0 ? `${months}mo ${days}d` : `${months}mo`;
  };

  type TabKey = "today" | "insights" | "profile";

  const tabs: { key: TabKey; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "insights", label: "Insights" },
    { key: "profile", label: "Profile" },
  ];

  const scheduleTabs = [
    { key: "plan", label: "Plan" },
    { key: "whatif", label: "What-if" },
  ] as const;

  type ScheduleTabKey = (typeof scheduleTabs)[number]["key"];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>CoddleAI</Text>
        <Text style={styles.subtitle}>Sleep Learner & Smart Schedule</Text>

        {babyProfile && (
          <View style={styles.babySummaryRow}>
            <Text style={styles.babySummaryText}>
              Baby: {babyProfile.name} (
              {formatBabyAge(babyProfile.birthDateISO)})
            </Text>
          </View>
        )}

        {/* TAB ROW */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "today" ? (
          <>
            <TimerCard
              elapsedLabel={elapsedLabel}
              error={error}
              isTiming={isTiming}
              onStart={handleStartTimer}
              onStop={handleStopTimer}
              saving={savingTimer}
              disabled={anySaving}
            />

            <DayHeader
              dateLabel={selectedDate.format("ddd, DD MMM")}
              totalSleepMin={totalSleepMin}
              learnerState={learnerState}
              onPrevDay={goPrevDay}
              onNextDay={goNextDay}
            />

            <TimelineStrip sleepByHour={sleepByHour} />

            <ManualEntryForm
              open={manualOpen}
              onToggle={() => setManualOpen((v) => !v)}
              manualStartLabel={
                manualStart
                  ? dayjs(manualStart).format("DD MMM, h:mm A")
                  : "Select"
              }
              manualEndLabel={
                manualEnd ? dayjs(manualEnd).format("DD MMM, h:mm A") : "Select"
              }
              onPressStartPicker={() => setShowStartPicker(true)}
              onPressEndPicker={() => setShowEndPicker(true)}
              quality={manualQuality}
              onChangeQuality={setManualQuality}
              notes={manualNotes}
              onChangeNotes={setManualNotes}
              onSave={handleSaveManual}
              saving={savingManual}
              disabled={anySaving}
            />

            <SessionsList
              sessions={sessions}
              loading={loadingSessions}
              editingSessionId={editingSession?.id ?? null}
              onPressSession={openEditSession}
            />

            {/* SCHEDULE SUB-TABS */}
            <View style={styles.scheduleTabRow}>
              {scheduleTabs.map((tab) => {
                const isActive = scheduleView === tab.key;

                return (
                  <Pressable
                    key={tab.key}
                    style={[
                      styles.scheduleTabButton,
                      isActive && styles.scheduleTabButtonActive,
                    ]}
                    onPress={() => setScheduleView(tab.key)}
                  >
                    <Text
                      style={[
                        styles.scheduleTabLabel,
                        isActive && styles.scheduleTabLabelActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {scheduleView === "plan" ? (
              <ScheduleSection upcomingSchedule={upcomingSchedule} />
            ) : (
              <WhatIfScheduleSection
                wakeOffsetMin={wakeOffsetMin}
                onChangeOffset={setWakeOffsetMin}
                previewSchedule={previewSchedule}
              />
            )}
          </>
        ) : activeTab === "insights" ? (
          <>
            {/* INSIGHTS TAB */}
            <TrendsChart
              data={weeklyTotals.map((d) => ({
                date: d.date.toISOString(),
                totalMin: d.totalMin,
              }))}
            />

            <CoachPanel insights={coachInsights} />
          </>
        ) : activeTab === "profile" ? (
          <>
            <BabyProfileCard
              profile={babyProfile}
              loading={loadingProfile}
              saving={savingProfile}
              onSaveProfile={handleSaveBabyProfile}
            />
            <NotificationLog entries={notificationPlan} />
          </>
        ) : null}
      </ScrollView>

      <EditSessionPanel
        editingSession={editingSession}
        editStartLabel={
          editStart ? dayjs(editStart).format("YYYY-MM-DD h:mm A") : "Select"
        }
        editEndLabel={
          editEnd ? dayjs(editEnd).format("YYYY-MM-DD h:mm A") : "Select"
        }
        onPressStartPicker={() => setShowEditStartPicker(true)}
        onPressEndPicker={() => setShowEditEndPicker(true)}
        quality={editQuality}
        onChangeQuality={setEditQuality}
        notes={editNotes}
        onChangeNotes={setEditNotes}
        confirmDeleteId={confirmDeleteId}
        onCancel={() => {
          setEditingSession(null);
          setConfirmDeleteId(null);
        }}
        onDelete={handleDeleteEdit}
        onSave={handleSaveEdit}
        saving={savingEdit}
      />

      {/* Pickers */}
      <DateTimePickerModal
        isVisible={showStartPicker}
        mode="datetime"
        date={manualStart ?? new Date()}
        onConfirm={(date) => {
          setManualStart(date);
          setShowStartPicker(false);
        }}
        onCancel={() => setShowStartPicker(false)}
      />

      <DateTimePickerModal
        isVisible={showEndPicker}
        mode="datetime"
        date={manualEnd ?? new Date()}
        onConfirm={(date) => {
          setManualEnd(date);
          setShowEndPicker(false);
        }}
        onCancel={() => setShowEndPicker(false)}
      />

      <DateTimePickerModal
        isVisible={showEditStartPicker}
        mode="datetime"
        date={editStart ?? new Date()}
        onConfirm={(date) => {
          setEditStart(date);
          setShowEditStartPicker(false);
        }}
        onCancel={() => setShowEditStartPicker(false)}
      />

      <DateTimePickerModal
        isVisible={showEditEndPicker}
        mode="datetime"
        date={editEnd ?? new Date()}
        onConfirm={(date) => {
          setEditEnd(date);
          setShowEditEndPicker(false);
        }}
        onCancel={() => setShowEditEndPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: "#f8fafc",
  },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  babySummaryRow: {
    marginBottom: 8,
  },
  babySummaryText: {
    fontSize: 13,
    color: "#4b5563",
    textAlign: "center",
  },
  tabRow: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    padding: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
  },
  tabLabel: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#111827",
    fontWeight: "700",
  },
  scheduleTabRow: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    padding: 2,
    marginTop: 8,
    marginBottom: 4,
  },
  scheduleTabButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  scheduleTabButtonActive: {
    backgroundColor: "#ffffff",
  },
  scheduleTabLabel: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
  },
  scheduleTabLabelActive: {
    color: "#111827",
    fontWeight: "700",
  },
});
