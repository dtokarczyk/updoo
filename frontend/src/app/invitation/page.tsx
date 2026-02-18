import { redirect } from 'next/navigation';

/**
 * Invitation flow now uses the job draft page with preview hash.
 * Redirect legacy /invitation links to login.
 */
export default function InvitationPage() {
  redirect('/login');
}
