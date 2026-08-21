// Family Management API
// Handles all family-related operations: create, join, leave, manage members, etc.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "../../services/auth/jwt";
import {
  FamilyRepository,
  FamilyMembersRepository,
  FamilyLocationsRepository,
} from "../../services/repositories/familyRepository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Verify authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = payload.userId;

    // GET: Get user's family or family details
    if (req.method === "GET") {
      const { action, familyId, inviteCode } = req.query;

      // Get family by invite code
      if (action === "by-invite" && inviteCode) {
        const family = await FamilyRepository.findByInviteCode(
          inviteCode as string,
        );
        if (!family) {
          return res.status(404).json({ error: "Family not found" });
        }

        // Get member count
        const memberCount = await FamilyMembersRepository.getMemberCount(
          family.id,
        );

        return res.status(200).json({
          success: true,
          family: {
            ...family,
            memberCount,
          },
        });
      }

      // Get family details with members
      if (action === "details" && familyId) {
        const family = await FamilyRepository.findById(familyId as string);
        if (!family) {
          return res.status(404).json({ error: "Family not found" });
        }

        // Verify user is a member
        const isMember = await FamilyMembersRepository.isMember(
          family.id,
          userId,
        );
        if (!isMember) {
          return res.status(403).json({ error: "Not a member of this family" });
        }

        // Get members with user info
        const members = await FamilyMembersRepository.findWithUserInfo(
          family.id,
        );

        // Get latest locations for members
        const locations =
          await FamilyLocationsRepository.getFamilyLocationsWithUserInfo(
            family.id,
          );

        return res.status(200).json({
          success: true,
          family,
          members,
          locations,
        });
      }

      // Default: Get user's families
      const families = await FamilyRepository.findByUserId(userId);

      // For each family, get member count and user's role
      const familiesWithDetails = await Promise.all(
        families.map(async (family) => {
          const memberCount = await FamilyMembersRepository.getMemberCount(
            family.id,
          );
          const role = await FamilyMembersRepository.getUserRole(
            family.id,
            userId,
          );
          return {
            ...family,
            memberCount,
            userRole: role,
          };
        }),
      );

      return res.status(200).json({
        success: true,
        families: familiesWithDetails,
      });
    }

    // POST: Create family, join family, or other actions
    if (req.method === "POST") {
      const { action } = req.body;

      // Create new family
      if (action === "create") {
        const { name } = req.body;

        if (!name || name.trim().length < 2) {
          return res
            .status(400)
            .json({ error: "Family name must be at least 2 characters" });
        }

        // Check if user already has a family
        const existingFamilies = await FamilyRepository.findByUserId(userId);
        if (existingFamilies.length > 0) {
          return res.status(400).json({
            error: "You already belong to a family. Leave it first to create a new one.",
          });
        }

        // Generate unique invite code
        let inviteCode: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
          inviteCode = FamilyRepository.generateInviteCode();
          const existing = await FamilyRepository.findByInviteCode(inviteCode);
          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          return res
            .status(500)
            .json({ error: "Failed to generate unique invite code" });
        }

        // Create family
        const family = await FamilyRepository.create({
          name: name.trim(),
          invite_code: inviteCode!,
          created_by: userId,
        });

        // Add creator as a member with 'creator' role
        await FamilyMembersRepository.addMember(family.id, userId, "creator");

        return res.status(201).json({
          success: true,
          family,
          message: "Family created successfully",
        });
      }

      // Join family via invite code
      if (action === "join") {
        const { inviteCode } = req.body;

        if (!inviteCode) {
          return res.status(400).json({ error: "Invite code is required" });
        }

        // Find family by invite code
        const family = await FamilyRepository.findByInviteCode(inviteCode);
        if (!family) {
          return res.status(404).json({ error: "Invalid invite code" });
        }

        // Check if user already belongs to a family
        const existingFamilies = await FamilyRepository.findByUserId(userId);
        if (existingFamilies.length > 0) {
          return res.status(400).json({
            error: "You already belong to a family. Leave it first to join another one.",
          });
        }

        // Check if user is already a member
        const isMember = await FamilyMembersRepository.isMember(
          family.id,
          userId,
        );
        if (isMember) {
          return res
            .status(400)
            .json({ error: "You are already a member of this family" });
        }

        // Add user as member
        await FamilyMembersRepository.addMember(family.id, userId, "member");

        return res.status(200).json({
          success: true,
          family,
          message: "Successfully joined family",
        });
      }

      // Leave family
      if (action === "leave") {
        const { familyId } = req.body;

        if (!familyId) {
          return res.status(400).json({ error: "Family ID is required" });
        }

        // Verify user is a member
        const role = await FamilyMembersRepository.getUserRole(
          familyId,
          userId,
        );
        if (!role) {
          return res
            .status(403)
            .json({ error: "You are not a member of this family" });
        }

        // Creators cannot leave - they must delete the family instead
        if (role === "creator") {
          return res.status(400).json({
            error:
              "As the creator, you cannot leave the family. Delete it instead.",
          });
        }

        // Remove member
        await FamilyMembersRepository.removeMember(familyId, userId);

        // Stop location sharing for this user
        await FamilyLocationsRepository.deleteForUser(userId);

        return res.status(200).json({
          success: true,
          message: "Successfully left family",
        });
      }

      return res.status(400).json({ error: "Invalid action" });
    }

    // PUT: Update family (regenerate invite code, etc.)
    if (req.method === "PUT") {
      const { action, familyId } = req.body;

      if (!familyId) {
        return res.status(400).json({ error: "Family ID is required" });
      }

      // Verify user is the creator
      const role = await FamilyMembersRepository.getUserRole(familyId, userId);
      if (role !== "creator") {
        return res
          .status(403)
          .json({ error: "Only the creator can perform this action" });
      }

      // Regenerate invite code
      if (action === "regenerate-invite") {
        let inviteCode: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
          inviteCode = FamilyRepository.generateInviteCode();
          const existing = await FamilyRepository.findByInviteCode(inviteCode);
          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          return res
            .status(500)
            .json({ error: "Failed to generate unique invite code" });
        }

        const updatedFamily = await FamilyRepository.regenerateInviteCode(
          familyId,
          inviteCode!,
        );

        return res.status(200).json({
          success: true,
          family: updatedFamily,
          message: "Invite code regenerated successfully",
        });
      }

      // Update family name
      if (action === "update-name") {
        const { name } = req.body;

        if (!name || name.trim().length < 2) {
          return res
            .status(400)
            .json({ error: "Family name must be at least 2 characters" });
        }

        const updatedFamily = await FamilyRepository.updateName(
          familyId,
          name.trim(),
        );

        return res.status(200).json({
          success: true,
          family: updatedFamily,
          message: "Family name updated successfully",
        });
      }

      return res.status(400).json({ error: "Invalid action" });
    }

    // DELETE: Remove member or delete family
    if (req.method === "DELETE") {
      const { action, familyId, memberId } = req.query;

      if (!familyId) {
        return res.status(400).json({ error: "Family ID is required" });
      }

      // Verify user is the creator
      const role = await FamilyMembersRepository.getUserRole(
        familyId as string,
        userId,
      );
      if (role !== "creator") {
        return res
          .status(403)
          .json({ error: "Only the creator can perform this action" });
      }

      // Remove a member
      if (action === "remove-member" && memberId) {
        // Cannot remove self
        if (memberId === userId) {
          return res
            .status(400)
            .json({ error: "Cannot remove yourself. Delete the family instead." });
        }

        // Check if member exists
        const isMember = await FamilyMembersRepository.isMember(
          familyId as string,
          memberId as string,
        );
        if (!isMember) {
          return res.status(404).json({ error: "Member not found" });
        }

        await FamilyMembersRepository.removeMember(
          familyId as string,
          memberId as string,
        );

        // Delete their location data
        await FamilyLocationsRepository.deleteForUser(memberId as string);

        return res.status(200).json({
          success: true,
          message: "Member removed successfully",
        });
      }

      // Delete family
      if (action === "delete-family") {
        // Get all members first
        const members = await FamilyMembersRepository.findByFamilyId(
          familyId as string,
        );

        // Delete all location data for all members
        for (const member of members) {
          await FamilyLocationsRepository.deleteForUser(member.user_id);
        }

        // Delete family (cascade will delete members)
        await FamilyRepository.delete(familyId as string);

        return res.status(200).json({
          success: true,
          message: "Family deleted successfully",
        });
      }

      return res.status(400).json({ error: "Invalid action" });
    }

    // Method not allowed
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Family API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
