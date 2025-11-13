// Roblox API utilities for fetching user information

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
    const response = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user from Roblox');
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      return {
        id: data.data[0].id,
        name: data.data[0].name,
        displayName: data.data[0].displayName,
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
    const response = await fetch(`https://users.roblox.com/v1/users/${userId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch user from Roblox');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      displayName: data.displayName,
    };
  } catch (error) {
    console.error('Error fetching Roblox user by ID:', error);
    throw error;
  }
}
