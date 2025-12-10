import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { migrateDbIfNeeded } from '../src/db/sqlite';

function Loading() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="coddleai.db"
      onInit={migrateDbIfNeeded}
      useSuspense
    >
      {/* Suspense fallback while DB is initializing */}
      <React.Suspense fallback={<Loading />}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </React.Suspense>
    </SQLiteProvider>
  );
}
