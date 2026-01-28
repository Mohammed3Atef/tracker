import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  roleId: z.string().uuid().optional(),
});

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

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!targetUser) {
      return fail("NOT_FOUND", "User not found", undefined, 404);
    }

    return ok(targetUser);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRoleApi("admin", "manager");

    if (currentUser instanceof NextResponse) {
      return currentUser;
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return fail("NOT_FOUND", "User not found", undefined, 404);
    }

    // Only admin can change roles
    if (validatedData.roleId && currentUser.role !== "admin") {
      return fail(
        "FORBIDDEN",
        "Only administrators can change user roles",
        undefined,
        403
      );
    }

    // Check if email already exists (if changing email)
    if (validatedData.email && validatedData.email !== targetUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return fail(
          "VALIDATION_ERROR",
          "Email already exists",
          { field: "email" },
          422
        );
      }
    }

    // Check if role exists (if changing role)
    if (validatedData.roleId) {
      const roleExists = await prisma.role.findUnique({
        where: { id: validatedData.roleId },
      });

      if (!roleExists) {
        return fail("NOT_FOUND", "Role not found", undefined, 404);
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.roleId && { roleId: validatedData.roleId }),
      },
      include: {
        profile: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return ok(updatedUser);
  } catch (error) {
    return handleApiError(error);
  }
}
