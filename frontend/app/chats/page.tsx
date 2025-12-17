import { redirect } from 'next/navigation';

/**
 * Chats Page - Redirects to Command Center
 */
export default function ChatsPage() {
  redirect('/command-center');
}

