import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="exams/index" options={{ headerShown: false }} />
      <Stack.Screen name="exams/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="exams/take" options={{ headerShown: false }} />
      <Stack.Screen name="attempts/index" options={{ headerShown: false }} />
    </Stack>
  );
}
