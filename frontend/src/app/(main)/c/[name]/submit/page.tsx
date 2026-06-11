import { SubmitPostView } from '@/views/SubmitPostView';

export default async function SubmitPostPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <SubmitPostView name={name} />;
}
