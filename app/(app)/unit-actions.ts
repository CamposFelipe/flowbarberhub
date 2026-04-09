"use server";

import { cookies } from "next/headers";

export async function setActiveUnit(unitId: string) {
  const cookieStore = await cookies();
  cookieStore.set("activeUnitId", unitId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
