import { Suspense } from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/groups/ProfileForm';
import ProfileSkeleton from '@/components/ui/skeletons/ProfileSkeleton';

async function ProfileContent() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <ProfileForm profile={session.user} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
