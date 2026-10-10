export interface SharedListing {
  id: string;
  title: string;
  description: string;
  aiEnhancedDescription: string;
  category: string;
  quantityValue: number;
  quantityUnit: string;
  photoUrl: string;
  donorName: string;
  donorOrg: string;
  donorPhone: string;
  locationAddress: string;
  landmark: string;
  distanceKm: number;
  prepTime: string;
  expiryHours: number;
  storageCondition: string;
  status: "SUBMITTED" | "VERIFIED" | "ACCEPTED" | "DECLINED";
  acceptedByOrg?: string;
  acceptedAt?: string;
  handoverOtp?: string;
  driverName?: string;
  driverEtaMinutes?: number;
  declineReason?: string;
  createdAt: string;
  dietaryBadges: string[];
  safetyScore: number;
}

export interface HandoverChatMessage {
  id: string;
  listingId: string;
  senderName: string;
  senderRole: "donor" | "recipient" | "volunteer" | "ai_agent";
  content: string;
  sentAt: string;
}

const STORAGE_KEY = "annasetu_shared_listings";
const CHAT_STORAGE_KEY = "annasetu_handover_chats";

const INITIAL_SEED_LISTINGS: SharedListing[] = [
  {
    id: "list-seed-01",
    title: "Fresh Dum Biryani & Mirchi Ka Salan",
    description: "Prepared for banquet lunch at 12:30 PM. Kept sealed in thermal insulated chafing vessels.",
    aiEnhancedDescription: "Freshly prepared aromatic basmati rice with mixed vegetables and slow-simmered curry. Insulated hot-holding verified (72°C). High protein, 100% vegetarian, zero microbial risk.",
    category: "Cooked Rice & Grains",
    quantityValue: 120,
    quantityUnit: "meals",
    photoUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60",
    donorName: "Jyotirmaya Sabat",
    donorOrg: "Sabat Banquet Catering",
    donorPhone: "+91 98765 43210",
    locationAddress: "80 Feet Road, Indiranagar, Bengaluru",
    landmark: "Near BDA Complex Indiranagar",
    distanceKm: 2.3,
    prepTime: "12:30 PM Today",
    expiryHours: 4,
    storageCondition: "Hot insulated vessels (>65°C)",
    status: "ACCEPTED",
    acceptedByOrg: "Shanti Ashram Community Kitchen",
    acceptedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    handoverOtp: "849-216",
    driverName: "Raju M. (AnnaSetu Volunteer Driver #84)",
    driverEtaMinutes: 18,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    dietaryBadges: ["Pure Veg", "High Protein", "FSSAI Inspected", "Hot-Held"],
    safetyScore: 98,
  },
  {
    id: "list-seed-02",
    title: "Dal Tadka & Handmade Wheat Rotis",
    description: "Temple Bhandara lunch surplus. Untouched, clean food-grade stainless steel containers.",
    aiEnhancedDescription: "Nutritious whole yellow lentil dal rich in plant protein with soft whole-wheat chapatis. Steam-packed in clean vessels. Highly suitable for children and elders.",
    category: "Breads & Curries",
    quantityValue: 85,
    quantityUnit: "meals",
    photoUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=60",
    donorName: "Mahesh Sharma",
    donorOrg: "Radha Krishna Temple Trust",
    donorPhone: "+91 98111 22334",
    locationAddress: "Malleshwaram 8th Cross, Bengaluru",
    landmark: "Opposite Flower Market",
    distanceKm: 4.1,
    prepTime: "1:00 PM Today",
    expiryHours: 5,
    storageCondition: "Clean sealed steel containers",
    status: "VERIFIED",
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    dietaryBadges: ["Pure Veg", "No Onion/Garlic", "Zero Artificial Colors", "FSSAI Compliant"],
    safetyScore: 99,
  }
];

export function getSharedListings(): SharedListing[] {
  if (typeof window === "undefined") return INITIAL_SEED_LISTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_LISTINGS));
      return INITIAL_SEED_LISTINGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SEED_LISTINGS;
  } catch {
    return INITIAL_SEED_LISTINGS;
  }
}

export function getSharedListingById(listingId: string): SharedListing | undefined {
  const all = getSharedListings();
  return all.find((l) => l.id === listingId);
}

export function saveSharedListing(listing: SharedListing): void {
  if (typeof window === "undefined") return;
  try {
    const current = getSharedListings();
    const updated = [listing, ...current.filter((item) => item.id !== listing.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("annasetu_listings_updated"));
  } catch (e) {
    console.error("Failed to save listing:", e);
  }
}

export function acceptSharedListing(
  listingId: string,
  recipientOrg: string,
  recipientName: string
): { success: boolean; otp: string; driverName: string; listing: SharedListing | null } {
  const current = getSharedListings();
  const listing = current.find((l) => l.id === listingId);
  if (!listing) return { success: false, otp: "", driverName: "", listing: null };

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const formattedOtp = `${otp.slice(0, 3)}-${otp.slice(3)}`;
  const driverName = "Raju M. (AnnaSetu Volunteer Driver #84)";

  const updatedListing: SharedListing = {
    ...listing,
    status: "ACCEPTED",
    acceptedByOrg: recipientOrg || `${recipientName}'s Ashram`,
    acceptedAt: new Date().toISOString(),
    handoverOtp: formattedOtp,
    driverName: driverName,
    driverEtaMinutes: 20,
  };

  const updatedList = current.map((l) => (l.id === listingId ? updatedListing : l));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  window.dispatchEvent(new CustomEvent("annasetu_listings_updated"));

  // Seed initial coordination messages between Donor and Receiver only
  const seedMessages: HandoverChatMessage[] = [
    {
      id: `chat-seed-1`,
      listingId,
      senderName: "Donor",
      senderRole: "donor",
      content: `Hello! Food (${listing.quantityValue} ${listing.quantityUnit}) is freshly prepared and packed in insulated containers at our venue. Ready for pickup!`,
      sentAt: "14:15",
    },
    {
      id: `chat-seed-2`,
      listingId,
      senderName: "Receiver",
      senderRole: "recipient",
      content: `Thank you! Our kitchen team is prepared to receive the meals upon arrival. Handover OTP is confirmed.`,
      sentAt: "14:20",
    }
  ];
  saveHandoverMessages(listingId, seedMessages);

  return { success: true, otp: formattedOtp, driverName, listing: updatedListing };
}

export function declineSharedListing(listingId: string, reason: string): boolean {
  const current = getSharedListings();
  const listing = current.find((l) => l.id === listingId);
  if (!listing) return false;

  const updatedListing: SharedListing = {
    ...listing,
    status: "DECLINED",
    declineReason: reason || "Capacity reached / Re-routed",
  };

  const updatedList = current.map((l) => (l.id === listingId ? updatedListing : l));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  window.dispatchEvent(new CustomEvent("annasetu_listings_updated"));

  return true;
}

// ================= CHAT STORAGE ================= //

export function getHandoverMessages(listingId: string): HandoverChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_KEY}_${listingId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHandoverMessages(listingId: string, messages: HandoverChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${CHAT_STORAGE_KEY}_${listingId}`, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent("annasetu_chat_updated", { detail: { listingId } }));
  } catch (e) {
    console.error("Failed to save chat:", e);
  }
}

export function addHandoverMessage(
  listingId: string,
  senderName: string,
  senderRole: "donor" | "recipient" | "volunteer" | "ai_agent",
  content: string
): HandoverChatMessage {
  const current = getHandoverMessages(listingId);
  const newMsg: HandoverChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    listingId,
    senderName,
    senderRole,
    content,
    sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
  const updated = [...current, newMsg];
  saveHandoverMessages(listingId, updated);
  return newMsg;
}
