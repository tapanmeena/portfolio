export type LabAccess = "public" | "case-study" | "private" | "restricted";
export type LabGroup = "built" | "hosted" | "operations";
export type LabIcon = "market" | "camera" | "media" | "workflow" | "gauge";

export interface LabEntry {
  id: string;
  title: string;
  description: string;
  group: LabGroup;
  access: LabAccess;
  icon: LabIcon;
  accent: string;
  stack: string[];
  projectUrl?: string;
  liveUrl?: string;
}

export interface LabGroupMeta {
  id: LabGroup;
  label: string;
}

export const labGroups: LabGroupMeta[] = [
  { id: "built", label: "built here" },
  { id: "hosted", label: "hosted here" },
  { id: "operations", label: "control plane" },
];

export const labEntries: LabEntry[] = [
  {
    id: "stalkmarket",
    title: "StalkMarket",
    description:
      "A Raspberry Pi trading assistant for NSE positions. It polls broker feeds, trails stops, and sends a message when a rule matters.",
    group: "built",
    access: "public",
    icon: "market",
    accent: "#10b981",
    stack: ["TypeScript", "Node.js", "SQLite", "Docker", "Raspberry Pi"],
    projectUrl: "/projects/stalkmarket",
    liveUrl: "https://stalkmarket.tapanmeena.com",
  },
  {
    id: "sentinel",
    title: "Sentinel",
    description:
      "A self-hosted multi-camera dashboard with live streams, motion-triggered recordings, and automatic RTSP recovery.",
    group: "built",
    access: "case-study",
    icon: "camera",
    accent: "#14b8a6",
    stack: ["Python", "Flask", "OpenCV", "Raspberry Pi"],
    projectUrl: "/projects/sentinel",
  },
  {
    id: "personal-media-cloud",
    title: "Personal Media Cloud",
    description:
      "A private photo archive and personal media library, kept close to home and available across trusted devices.",
    group: "hosted",
    access: "private",
    icon: "media",
    accent: "#3b82f6",
    stack: ["Immich", "Jellyfin", "Docker", "Local storage"],
  },
  {
    id: "automated-media-pipeline",
    title: "Automated Media Pipeline",
    description:
      "A coordinated set of services that organizes incoming libraries, sources metadata, handles transfers, and closes subtitle gaps.",
    group: "hosted",
    access: "restricted",
    icon: "workflow",
    accent: "#f59e0b",
    stack: ["Sonarr", "Radarr", "Prowlarr", "Bazarr", "qBittorrent"],
  },
  {
    id: "operations-layer",
    title: "Operations Layer",
    description:
      "Metrics, container management, and secured maintenance access for the systems running behind the workshop.",
    group: "operations",
    access: "restricted",
    icon: "gauge",
    accent: "#06b6d4",
    stack: ["Grafana", "Portainer", "Docker", "Cloudflare Tunnel"],
  },
];
