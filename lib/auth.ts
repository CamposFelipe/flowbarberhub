import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function fetchOrgSnapshot(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      planStatus: true,
      trialEndsAt: true,
      _count: { select: { units: true } },
    },
  });
  if (!org) return null;
  return {
    planStatus: org.planStatus as string,
    trialEndsAt: org.trialEndsAt.toISOString(),
    hasUnit: org._count.units > 0,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.password
        );
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          pendingPriceId: user.pendingPriceId,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign-in — populate base fields from authorize()
        token.role = user.role as Role;
        token.organizationId = user.organizationId as string | null;
        token.pendingPriceId = user.pendingPriceId as string | null;

        // Eagerly fetch org snapshot so middleware never needs to hit the DB
        if (user.organizationId) {
          const snap = await fetchOrgSnapshot(user.organizationId as string);
          if (snap) {
            token.planStatus = snap.planStatus;
            token.trialEndsAt = snap.trialEndsAt;
            token.hasUnit = snap.hasUnit;
          }
        } else {
          token.planStatus = null;
          token.trialEndsAt = null;
          token.hasUnit = false;
        }
      }

      // Refresh from DB whenever the client calls session.update().
      // Runs inside a Route Handler (Node.js runtime) — never in Edge middleware.
      if (trigger === "update" && token.sub) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { organizationId: true, pendingPriceId: true },
        });
        if (fresh) {
          token.organizationId = fresh.organizationId;
          token.pendingPriceId = fresh.pendingPriceId;

          if (fresh.organizationId) {
            const snap = await fetchOrgSnapshot(fresh.organizationId);
            if (snap) {
              token.planStatus = snap.planStatus;
              token.trialEndsAt = snap.trialEndsAt;
              token.hasUnit = snap.hasUnit;
            }
          } else {
            token.planStatus = null;
            token.trialEndsAt = null;
            token.hasUnit = false;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.organizationId = token.organizationId as string | null;
        session.user.pendingPriceId = token.pendingPriceId as string | null;
        session.user.planStatus = (token.planStatus as string | null) ?? null;
        session.user.trialEndsAt = (token.trialEndsAt as string | null) ?? null;
        session.user.hasUnit = (token.hasUnit as boolean) ?? false;
      }
      return session;
    },
  },
});
