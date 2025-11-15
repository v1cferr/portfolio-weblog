"use client";

import { useSelectedLayoutSegment } from "next/navigation";

import { Link } from "@/i18n/routing";

import type { ComponentProps } from "react";

/**
 *
 */
export default function NavigationLink({ href, ...rest }: ComponentProps<typeof Link>) {
  const selectedLayoutSegment = useSelectedLayoutSegment();
  const pathname = selectedLayoutSegment ? `/${selectedLayoutSegment}` : "/";
  const isActive = pathname === href;

  return <Link aria-current={isActive ? "page" : undefined} className={isActive ? "font-semibold" : "font-normal"} href={href} {...rest} />;
}
