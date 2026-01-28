import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRoleApi("admin", "manager");

    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    // Get all users with their profiles and roles
    const users = await prisma.user.findMany({
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            hireDate: true,
            department: true,
            position: true,
            salary: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        email: "asc",
      },
    });

    return ok(users);
  } catch (error) {
    return handleApiError(error);
  }
}
