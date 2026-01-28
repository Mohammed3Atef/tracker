import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Hash password for all users
  const hashedPassword = await bcrypt.hash("Demo@12345", 10);

  // Create Roles
  console.log("Creating roles...");
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Administrator with full system access",
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "manager" },
    update: {},
    create: {
      name: "manager",
      description: "Manager with team management and reporting access",
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: "employee" },
    update: {},
    create: {
      name: "employee",
      description: "Employee with basic time tracking and profile access",
    },
  });

  // Create Permissions
  console.log("Creating permissions...");
  const permissions = [
    // User permissions
    { name: "users.read", resource: "users", action: "read", description: "View users" },
    { name: "users.write", resource: "users", action: "write", description: "Create and update users" },
    { name: "users.delete", resource: "users", action: "delete", description: "Delete users" },
    
    // Role permissions
    { name: "roles.read", resource: "roles", action: "read", description: "View roles" },
    { name: "roles.write", resource: "roles", action: "write", description: "Create and update roles" },
    { name: "roles.delete", resource: "roles", action: "delete", description: "Delete roles" },
    
    // Time tracking permissions
    { name: "time.read", resource: "time", action: "read", description: "View time sessions" },
    { name: "time.write", resource: "time", action: "write", description: "Create and update time sessions" },
    { name: "time.delete", resource: "time", action: "delete", description: "Delete time sessions" },
    { name: "time.manage", resource: "time", action: "manage", description: "Manage all time sessions" },
    
    // Shift permissions
    { name: "shifts.read", resource: "shifts", action: "read", description: "View shifts" },
    { name: "shifts.write", resource: "shifts", action: "write", description: "Create and update shifts" },
    { name: "shifts.delete", resource: "shifts", action: "delete", description: "Delete shifts" },
    
    // Leave permissions
    { name: "leave.read", resource: "leave", action: "read", description: "View leave requests" },
    { name: "leave.write", resource: "leave", action: "write", description: "Create leave requests" },
    { name: "leave.approve", resource: "leave", action: "approve", description: "Approve/reject leave requests" },
    
    // Payroll permissions
    { name: "payroll.read", resource: "payroll", action: "read", description: "View payroll information" },
    { name: "payroll.write", resource: "payroll", action: "write", description: "Create and update payroll runs" },
    { name: "payroll.process", resource: "payroll", action: "process", description: "Process payroll runs" },
    
    // Reports permissions
    { name: "reports.read", resource: "reports", action: "read", description: "View reports" },
    { name: "reports.export", resource: "reports", action: "export", description: "Export reports" },
    
    // Audit permissions
    { name: "audit.read", resource: "audit", action: "read", description: "View audit logs" },
    
    // Settings permissions
    { name: "settings.read", resource: "settings", action: "read", description: "View settings" },
    { name: "settings.write", resource: "settings", action: "write", description: "Update settings" },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
  }

  // Map permissions to roles
  console.log("Mapping permissions to roles...");
  
  // Admin gets all permissions
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Manager gets most permissions except user/role management
  const managerPermissions = createdPermissions.filter(
    (p) =>
      !p.name.startsWith("users.") &&
      !p.name.startsWith("roles.") &&
      !p.name.startsWith("settings.")
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Employee gets basic permissions
  const employeePermissions = createdPermissions.filter(
    (p) =>
      p.name === "time.read" ||
      p.name === "time.write" ||
      p.name === "shifts.read" ||
      p.name === "leave.read" ||
      p.name === "leave.write" ||
      p.name === "payroll.read" ||
      p.name === "reports.read"
  );
  for (const permission of employeePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: employeeRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: employeeRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Create Users
  console.log("Creating users...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: {
      email: "manager@demo.com",
      password: hashedPassword,
      roleId: managerRole.id,
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: "employee@demo.com" },
    update: {},
    create: {
      email: "employee@demo.com",
      password: hashedPassword,
      roleId: employeeRole.id,
    },
  });

  // Create Employee Profiles
  console.log("Creating employee profiles...");
  await prisma.employeeProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      employeeId: "EMP001",
      firstName: "Admin",
      lastName: "User",
      phone: "+1-555-0101",
      address: "123 Admin Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
      hireDate: new Date("2020-01-15"),
      department: "IT",
      position: "System Administrator",
      salary: 95000.00,
    },
  });

  await prisma.employeeProfile.upsert({
    where: { userId: managerUser.id },
    update: {},
    create: {
      userId: managerUser.id,
      employeeId: "EMP002",
      firstName: "Manager",
      lastName: "User",
      phone: "+1-555-0102",
      address: "456 Manager Avenue",
      city: "New York",
      state: "NY",
      zipCode: "10002",
      country: "USA",
      hireDate: new Date("2021-03-20"),
      department: "Operations",
      position: "Operations Manager",
      salary: 75000.00,
    },
  });

  await prisma.employeeProfile.upsert({
    where: { userId: employeeUser.id },
    update: {},
    create: {
      userId: employeeUser.id,
      employeeId: "EMP003",
      firstName: "Employee",
      lastName: "User",
      phone: "+1-555-0103",
      address: "789 Employee Road",
      city: "New York",
      state: "NY",
      zipCode: "10003",
      country: "USA",
      hireDate: new Date("2022-06-10"),
      department: "Sales",
      position: "Sales Representative",
      salary: 55000.00,
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
