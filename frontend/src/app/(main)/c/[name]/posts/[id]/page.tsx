import { PostDetailView } from '@/views/PostDetailView';

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ name: string; id: string }>;
}) {
  const { name, id } = await params;
  return <PostDetailView name={name} id={id} />;
}
