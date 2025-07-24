import { NextPage } from "next";

interface PageProps {
  params: {
    projectId: string;
  };
}

const Page: NextPage<PageProps> = async ({ params }) => {
  const { projectId } = await params;
  return <div>{projectId}</div>;
};

export default Page;
