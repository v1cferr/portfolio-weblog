import {
  BriefcaseBusinessIcon,
  FolderGit2Icon,
  GitCommitVerticalIcon,
  GraduationCapIcon,
  HouseIcon,
  type LucideIcon,
  MonitorIcon,
  PenLineIcon,
  UserRoundIcon,
} from "lucide-react";

/** Primary sections, in reading order. Setup lives in the footer. */
export const NAV_ITEMS = [
  { href: "/about", key: "about", icon: UserRoundIcon },
  { href: "/career", key: "career", icon: BriefcaseBusinessIcon },
  { href: "/projects", key: "projects", icon: FolderGit2Icon },
  { href: "/timeline", key: "timeline", icon: GitCommitVerticalIcon },
  { href: "/education", key: "education", icon: GraduationCapIcon },
  { href: "/weblog", key: "weblog", icon: PenLineIcon },
] as const satisfies readonly { href: string; key: string; icon: LucideIcon }[];

export const HOME_ITEM = { href: "/", key: "home", icon: HouseIcon } as const;
export const SETUP_ITEM = { href: "/setup", key: "setup", icon: MonitorIcon } as const;
