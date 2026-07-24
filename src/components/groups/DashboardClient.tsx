"use client";

import { useState, useEffect } from "react";
import Walkthrough from "@/components/ui/Walkthrough";
import GroupList from "@/components/groups/GroupList";
import { STORAGE_KEYS } from "@/lib/constants";

interface DashboardClientProps {
  userId: string;
  userName: string;
  onboardingCompleted: boolean;
  groups: Array<{
    id: string;
    name: string;
    type: "pg" | "hostel" | "trip";
    members: Array<{ user_id: string }>;
  }>;
}

export default function DashboardClient({
  userId,
  userName,
  onboardingCompleted,
  groups,
}: DashboardClientProps) {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughPhase, setWalkthroughPhase] = useState<'create-group' | 'use-features' | null>(null);

  useEffect(() => {
    if (onboardingCompleted) return;

    const createDone = localStorage.getItem(STORAGE_KEYS.WALKTHROUGH_CREATE_DONE) === 'true';
    const hasGroups = groups.length > 0;

    if (!createDone && !hasGroups) {
      setWalkthroughPhase('create-group');
      setShowWalkthrough(true);
    } else if (createDone && hasGroups) {
      setWalkthroughPhase('use-features');
      setShowWalkthrough(true);
    }
  }, [onboardingCompleted, groups.length]);

  return (
    <>
      <GroupList groups={groups} userId={userId} />
      {showWalkthrough && walkthroughPhase && (
        <Walkthrough
          userId={userId}
          userName={userName}
          phase={walkthroughPhase}
          onComplete={() => setShowWalkthrough(false)}
        />
      )}
    </>
  );
}
