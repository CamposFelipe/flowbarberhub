import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      organizationId: string | null;
      pendingPriceId: string | null;
      planStatus: string | null;
      trialEndsAt: string | null;
      hasUnit: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    organizationId?: string | null;
    pendingPriceId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    organizationId?: string | null;
    pendingPriceId?: string | null;
    planStatus?: string | null;
    trialEndsAt?: string | null; // ISO string
    hasUnit?: boolean;
  }
}
