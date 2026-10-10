import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileTheme } from "../src/theme/tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: MobileTheme.colors.paper,
          },
          headerTintColor: MobileTheme.colors.forest,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: MobileTheme.colors.cream,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "AnnaSetu AI",
            headerTitleAlign: "center",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
