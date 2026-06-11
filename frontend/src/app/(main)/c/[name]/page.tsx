import { CommunityView } from '@/views/CommunityView';

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <CommunityView name={name} />;
}
