import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightSidebar } from '../components/RightSidebar';
import { TopBar } from '../components/TopBar';
export const AppShell: React.FC = () => {
  const location = useLocation();
  // Extract community handle from path if on a community page
  const match = location.pathname.match(/^\/r\/([^/]+)/);
  const communityHandle = match ? match[1] : undefined;
  // We'll pass the communityId to RightSidebar in the actual pages using a context or just let RightSidebar read the URL
  // For simplicity, RightSidebar will just read the URL or we can pass it down if we extract it.
  // Actually, let's let RightSidebar figure it out or we can just pass the handle and let it find the ID.
  return (
    <div className="min-h-screen bg-forest-bg flex flex-col lg:flex-row max-w-[1600px] mx-auto">
      <TopBar />
      <LeftSidebar />

      <main className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-2xl px-0 sm:px-4 py-4 sm:py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Right sidebar logic: we need to pass communityId if we are on a community page.
             We can do this by letting RightSidebar use a hook, but for now we'll just pass the handle and let it resolve. */}
      <RightSidebarWrapper handle={communityHandle} />
    </div>);

};
// Helper to resolve handle to ID for the RightSidebar
import { useAppContext } from '../context/AppContext';
const RightSidebarWrapper = ({ handle }: {handle?: string;}) => {
  const { communities } = useAppContext();
  const community = handle ?
  communities.find((c) => c.handle === handle) :
  undefined;
  return <RightSidebar communityId={community?.id} />;
};