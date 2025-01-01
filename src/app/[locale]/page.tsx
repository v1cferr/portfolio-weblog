import { Metadata } from "next";
import WorkInProgress from "@/components/WIP/WorkInProgress";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <WorkInProgress />
    </div>
  );
}
