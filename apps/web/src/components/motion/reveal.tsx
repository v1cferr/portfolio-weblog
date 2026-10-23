"use client";

import * as m from "motion/react-m";
import type { ComponentProps } from "react";

/*
 * Entrances: content rises a few pixels and fades in the first time it enters
 * the viewport. Lists stagger their items. Elements carry data-reveal so the
 * no-script style in the layout can show them without JavaScript.
 */

const item = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const list = { hidden: {}, shown: { transition: { staggerChildren: 0.04 } } };

const viewport = { once: true, margin: "0px 0px -10% 0px" } as const;

export function Reveal(props: ComponentProps<typeof m.div>) {
  return <m.div data-reveal="" variants={item} initial="hidden" whileInView="shown" viewport={viewport} {...props} />;
}

export function RevealList(props: ComponentProps<typeof m.ol>) {
  return <m.ol variants={list} initial="hidden" whileInView="shown" viewport={viewport} {...props} />;
}

export function RevealItem(props: ComponentProps<typeof m.li>) {
  return <m.li data-reveal="" variants={item} {...props} />;
}
