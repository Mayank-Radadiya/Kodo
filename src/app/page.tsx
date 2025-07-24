"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const trpc = useTRPC();
  const invoke = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/projects/${data.id}`);
      },
    })
  );

  return (
    <>
      <div className="flex flex-col items-center justify-center bg-zinc-800 text-white h-screen">
        <input
          onChange={(e) => setValue(e.target.value)}
          className="border w-[500px] rounded-xl p-2 mb-4"
        />
        <button
          disabled={invoke.isPending}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          onClick={() => invoke.mutate({ value: value })}
        >
          {invoke.isPending ? "Loading..." : "Invoke Inngest Function"}
        </button>
      </div>
    </>
  );
}
