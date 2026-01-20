import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserOption {
  id: string;
  user_id: string;
  value: string;
  label: string;
  sort_order: number;
  is_default: boolean;
  is_hidden: boolean;
  is_system: boolean;
}

export function useUserCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getVisibleCategories = useCallback(() => {
    return categories.filter(c => !c.is_hidden);
  }, [categories]);

  const getDefaultCategory = useCallback(() => {
    return categories.find(c => c.is_default && !c.is_hidden);
  }, [categories]);

  const addCategory = async (label: string) => {
    if (!user) return null;
    
    const value = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const maxOrder = Math.max(...categories.map(c => c.sort_order), 0);
    
    try {
      const { data, error } = await supabase
        .from("user_categories")
        .insert({
          user_id: user.id,
          value,
          label,
          sort_order: maxOrder + 1,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchCategories();
      return data;
    } catch (err) {
      console.error("Error adding category:", err);
      return null;
    }
  };

  const updateCategory = async (id: string, updates: Partial<UserOption>) => {
    try {
      const { error } = await supabase
        .from("user_categories")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      await fetchCategories();
      return true;
    } catch (err) {
      console.error("Error updating category:", err);
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchCategories();
      return true;
    } catch (err) {
      console.error("Error deleting category:", err);
      return false;
    }
  };

  const setDefault = async (id: string) => {
    if (!user) return false;
    
    try {
      // Clear existing default
      await supabase
        .from("user_categories")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      const { error } = await supabase
        .from("user_categories")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
      await fetchCategories();
      return true;
    } catch (err) {
      console.error("Error setting default:", err);
      return false;
    }
  };

  const reorder = async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from("user_categories")
          .update({ sort_order: index + 1 })
          .eq("id", id)
      );
      
      await Promise.all(updates);
      await fetchCategories();
      return true;
    } catch (err) {
      console.error("Error reordering:", err);
      return false;
    }
  };

  return {
    categories,
    loading,
    getVisibleCategories,
    getDefaultCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    setDefault,
    reorder,
    refetch: fetchCategories,
  };
}

export function useUserMeetingContexts() {
  const { user } = useAuth();
  const [contexts, setContexts] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContexts = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_meeting_contexts")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setContexts(data || []);
    } catch (err) {
      console.error("Error fetching contexts:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContexts();
  }, [fetchContexts]);

  const getVisibleContexts = useCallback(() => {
    return contexts.filter(c => !c.is_hidden);
  }, [contexts]);

  const getDefaultContext = useCallback(() => {
    return contexts.find(c => c.is_default && !c.is_hidden);
  }, [contexts]);

  const addContext = async (label: string) => {
    if (!user) return null;
    
    const value = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const maxOrder = Math.max(...contexts.map(c => c.sort_order), 0);
    
    try {
      const { data, error } = await supabase
        .from("user_meeting_contexts")
        .insert({
          user_id: user.id,
          value,
          label,
          sort_order: maxOrder + 1,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchContexts();
      return data;
    } catch (err) {
      console.error("Error adding context:", err);
      return null;
    }
  };

  const updateContext = async (id: string, updates: Partial<UserOption>) => {
    try {
      const { error } = await supabase
        .from("user_meeting_contexts")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      await fetchContexts();
      return true;
    } catch (err) {
      console.error("Error updating context:", err);
      return false;
    }
  };

  const deleteContext = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_meeting_contexts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchContexts();
      return true;
    } catch (err) {
      console.error("Error deleting context:", err);
      return false;
    }
  };

  const setDefault = async (id: string) => {
    if (!user) return false;
    
    try {
      // Clear existing default
      await supabase
        .from("user_meeting_contexts")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      const { error } = await supabase
        .from("user_meeting_contexts")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
      await fetchContexts();
      return true;
    } catch (err) {
      console.error("Error setting default:", err);
      return false;
    }
  };

  const reorder = async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from("user_meeting_contexts")
          .update({ sort_order: index + 1 })
          .eq("id", id)
      );
      
      await Promise.all(updates);
      await fetchContexts();
      return true;
    } catch (err) {
      console.error("Error reordering:", err);
      return false;
    }
  };

  return {
    contexts,
    loading,
    getVisibleContexts,
    getDefaultContext,
    addContext,
    updateContext,
    deleteContext,
    setDefault,
    reorder,
    refetch: fetchContexts,
  };
}
