import { redirect } from 'next/navigation';

export default async function LegacyStaffApplicationHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/staff/applications/${id}`);
}
