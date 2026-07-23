import { NextRequest } from "next/server";
import { getMockSessionUserId } from "@/lib/auth/mock-session";
import { getOnboardingStatus, setOnboardingCompleted } from "@/lib/db/store";

export async function GET(request: NextRequest) {
  try {
    const userId = getMockSessionUserId(request);
    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const completed = await getOnboardingStatus(userId);
    return Response.json({ onboarding_completed: completed });
  } catch (err) {
    return Response.json(
      { error: "Failed to get onboarding status", details: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getMockSessionUserId(request);
    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    await setOnboardingCompleted(userId);
    return Response.json({ onboarding_completed: true });
  } catch (err) {
    return Response.json(
      { error: "Failed to update onboarding status", details: String(err) },
      { status: 500 }
    );
  }
}
