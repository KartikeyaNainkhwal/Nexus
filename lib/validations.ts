import { z } from "zod";

// ═══════════════════════════════════════
// Auth
// ═══════════════════════════════════════

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number"),
    confirmPassword: z.string(),
    organizationName: z.string().min(2, "Organization name is required").max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ═══════════════════════════════════════
// Organization
// ═══════════════════════════════════════

export const organizationSchema = z.object({
  name: z.string().min(2, "Organization name is required").max(100),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logo: z.string().url("Invalid logo URL").optional().nullable(),
});

// ═══════════════════════════════════════
// Projects
// ═══════════════════════════════════════

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
    .optional(),
  emoji: z.string().max(4).optional(),
});

// ═══════════════════════════════════════
// Tasks
// ═══════════════════════════════════════

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  position: z.number().int().min(0).optional(),
});

export const taskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
});

export const taskPositionSchema = z.object({
  position: z.number().int().min(0),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
});

// ═══════════════════════════════════════
// Members & Invitations
// ═══════════════════════════════════════

export const invitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

// ═══════════════════════════════════════
// Profile / Settings
// ═══════════════════════════════════════

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  avatar: z.string().url("Invalid avatar URL").optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ═══════════════════════════════════════
// Billing
// ═══════════════════════════════════════

export const checkoutSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
});

// ═══════════════════════════════════════
// Inferred types
// ═══════════════════════════════════════

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;
export type TaskPositionInput = z.infer<typeof taskPositionSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
