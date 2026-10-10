import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MobileTheme } from "../src/theme/tokens";

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<"donor" | "recipient">("donor");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>अन्नसेतु · Food Rescue Network</Text>
        </View>
        <Text style={styles.title}>AnnaSetu AI</Text>
        <Text style={styles.subtitle}>
          Connecting surplus food from weddings & events with nearby shelters & community kitchens.
        </Text>
      </View>

      {/* Role Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, activeTab === "donor" && styles.toggleButtonActive]}
          onPress={() => setActiveTab("donor")}
        >
          <Text style={[styles.toggleText, activeTab === "donor" && styles.toggleTextActive]}>
            Donor Flow
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, activeTab === "recipient" && styles.toggleButtonActive]}
          onPress={() => setActiveTab("recipient")}
        >
          <Text style={[styles.toggleText, activeTab === "recipient" && styles.toggleTextActive]}>
            Recipient Flow
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mode Content Card */}
      {activeTab === "donor" ? (
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Have Surplus Prepared Food?</Text>
          <Text style={styles.cardBody}>
            Post surplus items with compulsory dish photos, preparation time, and collection window. Our agent matches nearby demand and verifies collection.
          </Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>+ Create Food Listing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Need Food for Your Shelter or Ashram?</Text>
          <Text style={styles.cardBody}>
            Report your daily meal demand, review incoming listing photos & safety evidence, and receive transparent quantity allocations.
          </Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Nearby Listings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ground Truth Policy */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          Safety First: Photos and preparation timestamps are mandatory for all listings. Handover requires recipient verification.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MobileTheme.colors.cream,
  },
  content: {
    padding: MobileTheme.spacing.lg,
  },
  header: {
    marginBottom: MobileTheme.spacing.lg,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: MobileTheme.colors.sage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: MobileTheme.radii.pill,
    marginBottom: 8,
  },
  badgeText: {
    color: MobileTheme.colors.forest,
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: MobileTheme.colors.forest,
  },
  subtitle: {
    fontSize: 14,
    color: MobileTheme.colors.inkSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: MobileTheme.colors.lineDefault,
    borderRadius: MobileTheme.radii.md,
    padding: 4,
    marginBottom: MobileTheme.spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: MobileTheme.radii.sm,
  },
  toggleButtonActive: {
    backgroundColor: MobileTheme.colors.paper,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: MobileTheme.colors.inkSecondary,
  },
  toggleTextActive: {
    color: MobileTheme.colors.forest,
  },
  card: {
    backgroundColor: MobileTheme.colors.paper,
    borderRadius: MobileTheme.radii.card,
    padding: MobileTheme.spacing.md,
    marginBottom: MobileTheme.spacing.lg,
    borderWidth: 1,
    borderColor: MobileTheme.colors.lineDefault,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: MobileTheme.colors.inkPrimary,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 13,
    color: MobileTheme.colors.inkSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: MobileTheme.colors.forest,
    borderRadius: MobileTheme.radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: MobileTheme.colors.paper,
    fontSize: 15,
    fontWeight: "bold",
  },
  infoBanner: {
    backgroundColor: MobileTheme.colors.sage,
    padding: 12,
    borderRadius: MobileTheme.radii.md,
  },
  infoText: {
    fontSize: 12,
    color: MobileTheme.colors.deep,
    lineHeight: 16,
  },
});
