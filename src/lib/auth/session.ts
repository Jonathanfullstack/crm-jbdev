import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export { SESSION_COOKIE };
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "SELLER";
  status: "ACTIVE" | "INACTIVE";
  workspace: {
    id: string;
    name: string;
    slug: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    primaryColor: string;
    secondaryColor: string | null;
    theme: "LIGHT" | "DARK" | "SYSTEM";
    showDeveloperCredit: boolean;
    onboardingDone: boolean;
  };
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookies().delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  if (session.user.status !== "ACTIVE") return null;

  const { user } = session;
  return {
    id: user.id,
    workspaceId: user.workspaceId,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    workspace: {
      id: user.workspace.id,
      name: user.workspace.name,
      slug: user.workspace.slug,
      logoUrl: user.workspace.logoUrl,
      faviconUrl: user.workspace.faviconUrl,
      phone: user.workspace.phone,
      email: user.workspace.email,
      website: user.workspace.website,
      primaryColor: user.workspace.primaryColor,
      secondaryColor: user.workspace.secondaryColor,
      theme: user.workspace.theme,
      showDeveloperCredit: user.workspace.showDeveloperCredit,
      onboardingDone: user.workspace.onboardingDone,
    },
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Sessão inválida.");
  }
  return user;
}

export function assertSameWorkspace(userWorkspaceId: string, resourceWorkspaceId: string) {
  if (userWorkspaceId !== resourceWorkspaceId) {
    throw new Error("Recurso não encontrado.");
  }
}
