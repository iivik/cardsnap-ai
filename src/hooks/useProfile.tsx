import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  subscription_tier: 'free' | 'pro' | 'business';
  subscription_status: 'none' | 'trialing' | 'active' | 'canceled' | 'expired';
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  scan_credits: number;
  total_scans_used: number;
  subscription_currency: 'INR' | 'USD';
  promo_code_used: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data as UserProfile | null);

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const canScan = useCallback(() => {
    if (!profile) return false;
    
    // Check if in trial period
    if (profile.trial_ends_at) {
      const trialEnd = new Date(profile.trial_ends_at);
      if (trialEnd > new Date()) return true;
    }
    
    // Check if has active subscription
    if (profile.subscription_status === 'active') return true;
    
    // Check if has scan credits
    if (profile.scan_credits > 0) return true;
    
    return false;
  }, [profile]);

  const getRemainingTrialDays = useCallback(() => {
    if (!profile?.trial_ends_at) return 0;
    
    const trialEnd = new Date(profile.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [profile]);

  const isTrialActive = useCallback(() => {
    if (!profile?.trial_ends_at) return false;
    return new Date(profile.trial_ends_at) > new Date();
  }, [profile]);

  const useScanCredit = async () => {
    if (!profile || profile.scan_credits <= 0) return false;

    try {
      const { data, error } = await supabase.rpc("decrement_scan_credit");
      if (error) throw error;
      if (!data) return false;
      await fetchProfile();
      return true;
    } catch (err) {
      console.error("Error using scan credit:", err);
      return false;
    }
  };

  const updateCurrency = async (currency: 'INR' | 'USD') => {
    if (!profile) return false;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_currency: currency })
        .eq("id", profile.id);

      if (error) throw error;
      await fetchProfile();
      return true;
    } catch (err) {
      console.error("Error updating currency:", err);
      return false;
    }
  };

  return {
    profile,
    loading,
    isAdmin,
    canScan,
    getRemainingTrialDays,
    isTrialActive,
    useScanCredit,
    updateCurrency,
    refetch: fetchProfile,
  };
}
