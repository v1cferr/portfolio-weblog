import { Metadata } from "next";
import Hero from "@/components/Homepage/Hero";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

export default function Home() {
  return (
    <>
      {/* <div>oi</div> */}
      <Hero />
    </>
  );
}
