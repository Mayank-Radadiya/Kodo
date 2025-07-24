import ProjectView from "@/modules/projects/ui/ProjectView";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { NextPage } from "next";
import { Suspense } from "react";

interface PageProps {
  params: {
    projectId: string;
  };
}

const Page: NextPage<PageProps> = async ({ params }) => {
  const { projectId } = await params;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.message.getMany.queryOptions({ projectId })
  );
  void queryClient.prefetchQuery(
    trpc.projects.getOne.queryOptions({ projectId })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <ProjectView projectId={projectId} />
        </div>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
