"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export default function Home() {
  const [value, setValue] = useState("");

  const trpc = useTRPC();
  const invoke = useMutation(
    trpc.invoke.mutationOptions({
      onSuccess: (data) => {
        console.log("Response:", data);
      },
    })
  );

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <input
          onChange={(e) => setValue(e.target.value)}
          className="border w-[500px] rounded-xl p-2 mb-4 mt-5"
        />
        <button
          disabled={invoke.isPending}
          onClick={() => invoke.mutate({ input: value })}
        >
          {invoke.isPending ? "Loading..." : "Invoke Inngest Function"}
        </button>
      </div>
    </>
  );
}
