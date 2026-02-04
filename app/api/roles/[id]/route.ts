import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRoleApi("admin");

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    // Get role with permissions
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return fail("NOT_FOUND", "Role not found", undefined, 404);
    }

    // Transform to include permission details
    const roleWithPermissions = {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
    };

    return ok(roleWithPermissions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRoleApi("admin");

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description }: { name?: string; description?: string } = body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return fail("NOT_FOUND", "Role not found", undefined, 404);
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingRole.name) {
      const conflictingRole = await prisma.role.findUnique({
        where: { name },
      });

      if (conflictingRole) {
        return fail("VALIDATION_ERROR", "Role with this name already exists", undefined, 422);
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Transform to include permission details
    const roleWithPermissions = {
      ...updatedRole,
      permissions: updatedRole.permissions.map((rp) => rp.permission),
    };

    return ok(roleWithPermissions);
  } catch (error) {
    return handleApiError(error);
  }
}
