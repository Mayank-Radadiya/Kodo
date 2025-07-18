"use client";
import { TRPCReactProvider } from "@/trpc/client";

interface ProviderProps {
  children: React.ReactNode;
}

const Provider = ({ children }: ProviderProps) => {
  return (
    <>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </>
  );
};

export default Provider;
