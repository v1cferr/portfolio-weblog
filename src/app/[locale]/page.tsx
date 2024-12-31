import { Metadata } from "next";
import WIP from "@/components/WIP/WIP";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <WIP />
    </div>
  );
}
