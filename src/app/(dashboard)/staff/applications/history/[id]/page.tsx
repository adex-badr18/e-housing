import { redirect } from 'next/navigation';

export default function LegacyStaffApplicationHistoryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/staff/applications/${params.id}`);
}
