// Roblox API utilities for fetching user information via edge function proxy

import { supabase } from "@/integrations/supabase/client";

const PROXY_URL = "https://ulcdxubnxhdcqkovtuxn.supabase.co/functions/v1/roblox-proxy";

export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
}

/**
 * Get authorization headers for authenticated requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get Roblox user by username
 */
export async function getUserByUsername(username: string): Promise<RobloxUser | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}?action=username&value=${encodeURIComponent(username)}`, {
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch user from Roblox');
    }

    const data = await response.json();
    
    if (data.found && data.user) {
      return {
        id: data.user.id,
        name: data.user.name,
        displayName: data.user.displayName,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Roblox user by username:', error);
    throw error;
  }
}

/**
 * Get Roblox user by ID
 */
export async function getUserById(userId: string): Promise<RobloxUser | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}?action=id&value=${encodeURIComponent(userId)}`, {
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch user from Roblox');
    }

    const data = await response.json();
    
    if (data.found && data.user) {
      return {
        id: data.user.id,
        name: data.user.name,
        displayName: data.user.displayName,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Roblox user by ID:', error);
    throw error;
  }
}
