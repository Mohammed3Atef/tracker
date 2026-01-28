import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  salary: z.number().positive().optional().nullable(),
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

    const profile = await prisma.employeeProfile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return fail("NOT_FOUND", "Employee profile not found", undefined, 404);
    }

    return ok(profile);
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
    const validatedData = updateProfileSchema.parse(body);

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return fail("NOT_FOUND", "User not found", undefined, 404);
    }

    // Only admin can change salary
    if (validatedData.salary !== undefined && currentUser.role !== "admin") {
      return fail(
        "FORBIDDEN",
        "Only administrators can change salary",
        undefined,
        403
      );
    }

    // Check if profile exists
    const existingProfile = await prisma.employeeProfile.findUnique({
      where: { userId: id },
    });

    if (!existingProfile) {
      return fail("NOT_FOUND", "Employee profile not found", undefined, 404);
    }

    // Update profile
    const updatedProfile = await prisma.employeeProfile.update({
      where: { userId: id },
      data: {
        ...(validatedData.firstName !== undefined && {
          firstName: validatedData.firstName,
        }),
        ...(validatedData.lastName !== undefined && {
          lastName: validatedData.lastName,
        }),
        ...(validatedData.phone !== undefined && {
          phone: validatedData.phone,
        }),
        ...(validatedData.address !== undefined && {
          address: validatedData.address,
        }),
        ...(validatedData.city !== undefined && { city: validatedData.city }),
        ...(validatedData.state !== undefined && {
          state: validatedData.state,
        }),
        ...(validatedData.zipCode !== undefined && {
          zipCode: validatedData.zipCode,
        }),
        ...(validatedData.country !== undefined && {
          country: validatedData.country,
        }),
        ...(validatedData.department !== undefined && {
          department: validatedData.department,
        }),
        ...(validatedData.position !== undefined && {
          position: validatedData.position,
        }),
        ...(validatedData.salary !== undefined && {
          salary: validatedData.salary,
        }),
      },
    });

    return ok(updatedProfile);
  } catch (error) {
    return handleApiError(error);
  }
}
