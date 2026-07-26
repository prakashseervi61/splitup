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

  useEffect(() => {
    if (onboardingCompleted || groups.length > 0) return;
    const createDone = localStorage.getItem(STORAGE_KEYS.WALKTHROUGH_CREATE_DONE) === 'true';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with localStorage (external system)
    if (!createDone) setShowWalkthrough(true);
  }, [onboardingCompleted, groups.length]);

  return (
    <>
      <GroupList groups={groups} userId={userId} />
      {showWalkthrough && (
        <Walkthrough
          userId={userId}
          userName={userName}
          onComplete={() => setShowWalkthrough(false)}
        />
      )}
    </>
  );
}
