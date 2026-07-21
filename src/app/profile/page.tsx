import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/groups/ProfileForm';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <ProfileForm profile={session.user} />
    </div>
  );
}
