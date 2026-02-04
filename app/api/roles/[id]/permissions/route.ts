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
    const user = await requireRoleApi("admin", "manager");

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    // Get role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: id },
      include: {
        permission: true,
      },
    });

    const permissions = rolePermissions.map((rp) => rp.permission);

    return ok(permissions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
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
    const { permissionId }: { permissionId: string } = body;

    if (!permissionId) {
      return fail("VALIDATION_ERROR", "permissionId is required", undefined, 422);
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return fail("NOT_FOUND", "Role not found", undefined, 404);
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return fail("NOT_FOUND", "Permission not found", undefined, 404);
    }

    // Check if permission is already assigned
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: id,
          permissionId,
        },
      },
    });

    if (existing) {
      return fail("VALIDATION_ERROR", "Permission already assigned to this role", undefined, 422);
    }

    // Add permission to role
    await prisma.rolePermission.create({
      data: {
        roleId: id,
        permissionId,
      },
    });

    // Get updated role with permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: id },
      include: {
        permission: true,
      },
    });

    const permissions = rolePermissions.map((rp) => rp.permission);

    return ok(permissions, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
