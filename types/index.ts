export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";
export type OrgMemberRole = "OWNER" | "ADMIN" | "MEMBER";
/** @deprecated use OrgMemberRole */
export type Role = OrgMemberRole;
export type SubscriptionPlan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED";
export type Plan = SubscriptionPlan;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: SubscriptionPlan;

  razorpayCustomerId?: string | null;
  razorpaySubscriptionId?: string | null;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrgMemberRole;
  joinedAt: string;
  user?: User;
  projectCount?: number;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string;
  emoji: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
}

export interface Task {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string | null;
  createdById: string;
  dueDate: string | null;
  position: number;
  project?: Project;
  assignedTo?: User | null;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrgMemberRole;
  token: string;
  status: InvitationStatus;
  invitedById: string;
  invitedBy?: User;
  expiresAt: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  organizationId: string;

  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  status: string;
  currentPeriodEnd: string;
  plan: SubscriptionPlan;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Document {
  id: string;
  organizationId: string;
  projectId: string | null;
  title: string;
  content: Record<string, unknown> | null;
  emoji: string;
  createdById: string;
  lastEditedById: string | null;
  isPublic: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  lastEditedBy?: User | null;
  project?: Pick<Project, 'id' | 'name' | 'emoji'> | null;
}

export interface DocumentCollaborator {
  id: string;
  documentId: string;
  userId: string;
  canEdit: boolean;
  user?: User;
}
