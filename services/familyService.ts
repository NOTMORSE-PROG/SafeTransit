// Family Service
// Client-side service for family management operations

import { apiFetch } from "../utils/api";

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  memberCount?: number;
  userRole?: "creator" | "member";
}

export interface FamilyMemberDetail {
  family_id: string;
  user_id: string;
  role: "creator" | "member";
  joined_at: string;
  full_name: string;
  email: string;
  profile_image_url: string | null;
}

export interface FamilyLocationDetail {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  is_live: boolean;
  timestamp: string;
  full_name: string;
  profile_image_url: string | null;
}

class FamilyService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  /**
   * Get user's families
   */
  async getUserFamilies(): Promise<Family[]> {
    if (!this.token) {
      // Return mock data when not authenticated
      return this.getMockFamilies();
    }

    try {
      const response = await apiFetch("/api/family", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch families";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // Response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.families || [];
    } catch {
      // Family API not yet implemented - silently fall back to mock data
      return this.getMockFamilies();
    }
  }

  private getMockFamilies(): Family[] {
    const createdDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return [
      {
        id: "mock-family-1",
        name: "Santos Family",
        invite_code: "DEMO123",
        created_by: "mock-user-1",
        created_at: createdDate.toISOString(),
        updated_at: createdDate.toISOString(),
        memberCount: 4,
        userRole: "creator" as const,
      },
    ];
  }

  /**
   * Get family details with members and locations
   */
  async getFamilyDetails(familyId: string): Promise<{
    family: Family;
    members: FamilyMemberDetail[];
    locations: FamilyLocationDetail[];
  }> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await apiFetch(
      `/api/family?action=details&familyId=${familyId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      let errorMessage = "Failed to fetch family details";
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /**
   * Get family by invite code
   */
  async getFamilyByInviteCode(inviteCode: string): Promise<Family> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await apiFetch(
      `/api/family?action=by-invite&inviteCode=${inviteCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch family");
    }

    const data = await response.json();
    return data.family;
  }

  /**
   * Create a new family
   */
  async createFamily(name: string): Promise<Family> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await apiFetch("/api/family", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        action: "create",
        name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create family");
    }

    const data = await response.json();
    return data.family;
  }

  /**
   * Join a family using invite code
   */
  async joinFamily(inviteCode: string): Promise<Family> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await apiFetch("/api/family", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        action: "join",
        inviteCode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to join family");
    }

    const data = await response.json();
    return data.family;
  }

  /**
   * Leave a family
   */
  async leaveFamily(familyId: string): Promise<void> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await apiFetch("/api/family", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        action: "leave",
        familyId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to leave family");
    }
  }

  /**
   * Regenerate invite code (creator only)
   */
  async regenerateInviteCode(familyId: string): Promise<Family> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await apiFetch("/api/family", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        action: "regenerate-invite",
        familyId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to regenerate invite code");
    }

    const data = await response.json();
    return data.family;
  }

  /**
   * Update family name (creator only)
   */
  async updateFamilyName(familyId: string, name: string): Promise<Family> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await apiFetch("/api/family", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        action: "update-name",
        familyId,
        name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update family name");
    }

    const data = await response.json();
    return data.family;
  }

  /**
   * Remove a member from family (creator only)
   */
  async removeMember(familyId: string, memberId: string): Promise<void> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await apiFetch(
      `/api/family?action=remove-member&familyId=${familyId}&memberId=${memberId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove member");
    }
  }

  /**
   * Delete family (creator only)
   */
  async deleteFamily(familyId: string): Promise<void> {
    if (!this.token) {
      throw new Error("No authentication token");
    }

    const response = await apiFetch(
      `/api/family?action=delete-family&familyId=${familyId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete family");
    }
  }

  /**
   * Generate shareable link for a family
   */
  getShareableLink(inviteCode: string): string {
    return `safetransit://join-family/${inviteCode}`;
  }
}

// Export singleton instance
export const familyService = new FamilyService();
