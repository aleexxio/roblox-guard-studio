// Roblox API utilities for fetching user information via edge function proxy

const PROXY_URL = "https://ulcdxubnxhdcqkovtuxn.supabase.co/functions/v1/roblox-proxy";

export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
}

/**
 * Get Roblox user by username
 */
export async function getUserByUsername(username: string): Promise<RobloxUser | null> {
  try {
    const response = await fetch(`${PROXY_URL}?action=username&value=${encodeURIComponent(username)}`);

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
    const response = await fetch(`${PROXY_URL}?action=id&value=${encodeURIComponent(userId)}`);

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
