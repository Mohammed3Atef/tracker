import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcrypt";

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

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleApi("admin");

    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    const body = await req.json();
    const {
      email,
      password,
      roleId,
      profile,
    }: {
      email: string;
      password: string;
      roleId: string;
      profile?: {
        firstName: string;
        lastName: string;
        employeeId: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        hireDate: string; // ISO date string
        department?: string;
        position?: string;
        salary?: number;
      };
    } = body;

    // Validation
    if (!email || !password || !roleId) {
      return fail(
        "VALIDATION_ERROR",
        "Email, password, and roleId are required",
        undefined,
        422
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail("VALIDATION_ERROR", "Invalid email format", undefined, 422);
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return fail(
        "VALIDATION_ERROR",
        "Password must be at least 8 characters long",
        undefined,
        422
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return fail("VALIDATION_ERROR", "User with this email already exists", undefined, 422);
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return fail("VALIDATION_ERROR", "Invalid role ID", undefined, 422);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate profile if provided
    if (profile) {
      if (!profile.firstName || !profile.lastName || !profile.employeeId || !profile.hireDate) {
        return fail(
          "VALIDATION_ERROR",
          "Profile must include firstName, lastName, employeeId, and hireDate",
          undefined,
          422
        );
      }

      // Check if employeeId already exists
      const existingProfile = await prisma.employeeProfile.findUnique({
        where: { employeeId: profile.employeeId },
      });

      if (existingProfile) {
        return fail(
          "VALIDATION_ERROR",
          "Employee ID already exists",
          undefined,
          422
        );
      }
    }

    // Create user with optional profile
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        roleId,
        ...(profile && {
          profile: {
            create: {
              firstName: profile.firstName,
              lastName: profile.lastName,
              employeeId: profile.employeeId,
              phone: profile.phone || null,
              address: profile.address || null,
              city: profile.city || null,
              state: profile.state || null,
              zipCode: profile.zipCode || null,
              country: profile.country || null,
              hireDate: new Date(profile.hireDate),
              department: profile.department || null,
              position: profile.position || null,
              salary: profile.salary ? profile.salary : null,
            },
          },
        }),
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

    return ok(newUser, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
