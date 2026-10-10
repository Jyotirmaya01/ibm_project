"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "donor" | "recipient" | "volunteer" | "coordinator" | "safety_reviewer" | "admin";

export interface UserContextType {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
  token: string;
}

interface AuthContextValue {
  user: UserContextType | null;
  loading: boolean;
  loginAsRole: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const DEFAULT_USERS: Record<UserRole, UserContextType> = {
  donor: {
    id: "d0000000-0000-0000-0000-000000000001",
    email: "donor@annasetu.org",
    fullName: "Radha Wedding Caterers",
    role: "donor",
    permissions: ["listing:create", "listing:update_own", "listing:view_own", "listing:view_available"],
    token: "mock-token-donor",
  },
  recipient: {
    id: "r0000000-0000-0000-0000-000000000001",
    email: "recipient@annasetu.org",
    fullName: "Shanti Ashram Kitchen Staff",
    role: "recipient",
    permissions: ["listing:view_available", "capacity:submit", "allocation:respond", "handover:confirm"],
    token: "mock-token-recipient",
  },
  coordinator: {
    id: "c0000000-0000-0000-0000-000000000001",
    email: "coordinator@annasetu.org",
    fullName: "Regional Coordinator Bengaluru",
    role: "coordinator",
    permissions: ["operations:view", "org:verify", "allocation:view_all", "safety:view_queue", "safety:clear_review", "safety:flag_hold"],
    token: "mock-token-coordinator",
  },
  safety_reviewer: {
    id: "s0000000-0000-0000-0000-000000000001",
    email: "reviewer@annasetu.org",
    fullName: "FSSAI Trained Food Safety Specialist",
    role: "safety_reviewer",
    permissions: ["safety:view_queue", "safety:clear_review", "safety:flag_hold", "operations:view"],
    token: "mock-token-safety_reviewer",
  },
  volunteer: {
    id: "v0000000-0000-0000-0000-000000000001",
    email: "volunteer@annasetu.org",
    fullName: "Community Pickup Volunteer",
    role: "volunteer",
    permissions: ["pickup:view_assigned", "pickup:update_status", "listing:view_available"],
    token: "mock-token-volunteer",
  },
  admin: {
    id: "a0000000-0000-0000-0000-000000000001",
    email: "admin@annasetu.org",
    fullName: "System Administrator",
    role: "admin",
    permissions: ["operations:view", "org:verify", "admin:manage_roles", "admin:view_audit", "admin:config"],
    token: "mock-token-admin",
  },
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  loginAsRole: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserContextType | null>(DEFAULT_USERS.coordinator);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("annasetu_role") as UserRole | null;
    if (savedRole && DEFAULT_USERS[savedRole]) {
      setUser(DEFAULT_USERS[savedRole]);
    }
  }, []);

  const loginAsRole = async (role: UserRole) => {
    setLoading(true);
    const selected = DEFAULT_USERS[role];
    setUser(selected);
    localStorage.setItem("annasetu_role", role);
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("annasetu_role");
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAsRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
