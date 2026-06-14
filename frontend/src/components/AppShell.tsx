'use client';

import { usePathname } from 'next/navigation';
import { LeftSidebar } from '@/components/LeftSidebar';
import { Navbar } from '@/components/Navbar';
import { RightSidebar } from '@/components/RightSidebar';
import { useAppContext } from '@/context/AppContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const match = pathname.match(/^\/c\/([^/]+)/);
  const communityName = match ? match[1] : undefined;

  return (
    <div className="min-h-screen bg-forest-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1 max-w-[1600px] mx-auto w-full lg:flex-row">
        <LeftSidebar />

        <main className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-2xl px-0 sm:px-4 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>

        <RightSidebarWrapper communityName={communityName} />
      </div>
    </div>
  );
}

function RightSidebarWrapper({ communityName }: { communityName?: string }) {
  const { communities } = useAppContext();
  const community = communityName
    ? communities.find((c) => c.name === communityName)
    : undefined;
  return <RightSidebar communityId={community?.id} />;
}
