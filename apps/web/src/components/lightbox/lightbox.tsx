"use client";

import * as m from "motion/react-m";
import {
  type ComponentType,
  createContext,
  type MouseEvent,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { LightboxDialogProps } from "./lightbox-dialog";
import { type LightboxItem, PHOTO_PARAM, parsePhoto, photoValue, urlWithPhoto } from "./photo-param";

/*
 * The lightbox, in two parts. This file is what every page with images pays
 * for: a provider and the triggers, which are the plain links the server
 * rendered (they open the file without JavaScript, and with a modifier key).
 * The dialog itself (Radix, the large image, the controls) is a separate chunk,
 * fetched when a thumbnail is hovered, focused or touched, and at the latest on
 * the click.
 */

const loadDialog = () => import("./lightbox-dialog").then((module) => module.LightboxDialog);

interface LightboxContextValue {
  items: readonly LightboxItem[];
  /** The open image and the one the dialog morphs from and back into, so the triggers re-render (and Motion measures them) when they change. */
  current: number | null;
  morph: number | null;
  layoutId: (index: number) => string;
  open: (index: number) => void;
  register: (index: number, anchor: HTMLAnchorElement | null) => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

/**
 * One gallery: the images a visitor can step through with the arrows. `id`
 * names it in the URL (`?photo=<id>-<n>`), so it must be unique on the page
 * and stable, such as the entity's id.
 */
export function Lightbox({ id, items, children }: { id: string; items: readonly LightboxItem[]; children: ReactNode }) {
  const [Dialog, setDialog] = useState<ComponentType<LightboxDialogProps> | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [morph, setMorph] = useState<number | null>(null);
  // Whether this page pushed the history entry the open image lives in; if so, closing goes back to it.
  const pushed = useRef(false);
  const anchors = useRef(new Map<number, HTMLAnchorElement>());
  // The dialog, the open image and the morph change in one render, after the
  // chunk has loaded: Motion measures the thumbnail in the same commit the
  // large view mounts, which is what lets one grow into the other.
  const show = useCallback((next: number | null, from: number | null) => {
    void loadDialog().then((component) => {
      setDialog(() => component);
      setMorph(from);
      setIndex(next);
    });
  }, []);

  useEffect(() => {
    const sync = (event?: PopStateEvent) => {
      const found = parsePhoto(new URLSearchParams(window.location.search).get(PHOTO_PARAM), id, items.length);
      if (found === null) {
        pushed.current = false;
        setIndex(null);
        return;
      }
      // Forward into an image: the entry before it is the page itself, so closing can go back.
      pushed.current = event !== undefined;
      show(found, null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
    };
  }, [id, items.length, show]);

  const value = useMemo<LightboxContextValue>(
    () => ({
      items,
      current: index,
      morph,
      layoutId: (i) => `lightbox-${id}-${String(i)}`,
      open: (i) => {
        window.history.pushState(null, "", urlWithPhoto(photoValue(id, i)));
        pushed.current = true;
        show(i, i);
      },
      register: (i, anchor) => {
        if (anchor === null) anchors.current.delete(i);
        else anchors.current.set(i, anchor);
      },
    }),
    [id, items, index, morph, show]
  );

  const navigate = useCallback(
    (next: number) => {
      window.history.replaceState(null, "", urlWithPhoto(photoValue(id, next)));
      setMorph(null);
      setIndex(next);
    },
    [id]
  );

  const close = useCallback(() => {
    // Back removes the entry the click added, so the Back button and the close button leave the same history.
    if (pushed.current) {
      window.history.back();
      return;
    }
    window.history.replaceState(null, "", urlWithPhoto(null));
    setIndex(null);
  }, []);

  return (
    <LightboxContext value={value}>
      {children}
      {Dialog !== null && (
        <Dialog
          items={items}
          index={index}
          morph={morph}
          layoutId={value.layoutId}
          onNavigate={navigate}
          onClose={close}
          anchorFor={(i) => anchors.current.get(i)}
        />
      )}
    </LightboxContext>
  );
}

function plainLeftClick(event: MouseEvent) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

const preload = () => {
  void loadDialog();
};

/**
 * A thumbnail that opens image `index` of the surrounding Lightbox. It stays
 * a link to the file: without JavaScript, or with a modifier key or the middle
 * button, the browser opens the image itself. `frameClassName` sizes the inner
 * frame the large view grows out of (fill images need it absolute).
 */
export function LightboxTrigger({
  index,
  className,
  frameClassName = "relative size-full",
  children,
}: {
  index: number;
  className?: string;
  frameClassName?: string;
  children: ReactNode;
}) {
  const context = use(LightboxContext);
  if (context === null) throw new Error("LightboxTrigger must be inside a Lightbox");
  const item = context.items[index];
  if (item === undefined) throw new Error(`Lightbox has no image ${String(index)}`);
  const { open, register, layoutId } = context;
  return (
    <a
      href={item.src}
      ref={(anchor) => {
        register(index, anchor);
        return () => {
          register(index, null);
        };
      }}
      className={className}
      onPointerEnter={preload}
      onTouchStart={preload}
      onFocus={preload}
      onClick={(event) => {
        if (!plainLeftClick(event)) return;
        event.preventDefault();
        open(index);
      }}
    >
      <m.div layoutId={layoutId(index)} className={frameClassName}>
        {children}
      </m.div>
    </a>
  );
}
