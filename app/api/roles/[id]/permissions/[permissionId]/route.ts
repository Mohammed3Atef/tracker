import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; permissionId: string }> }
) {
  try {
    const user = await requireRoleApi("admin");

    if (user instanceof NextResponse) {
      return user;
    }

    const { id, permissionId } = await params;

    // Check if role permission exists
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: id,
          permissionId,
        },
      },
    });

    if (!rolePermission) {
      return fail("NOT_FOUND", "Permission not assigned to this role", undefined, 404);
    }

    // Remove permission from role
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId: id,
          permissionId,
        },
      },
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
