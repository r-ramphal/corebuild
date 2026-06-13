import {
  Cpu, Monitor, Layers, Database, HardDrive, Zap, Server, Wind,
  MonitorPlay, Keyboard, Mouse, Headphones, Mic, Webcam, Speaker,
  Fan, Syringe, AudioLines, Network, Video, AppWindow, Cable,
} from "lucide-react";
import type { ComponentType } from "./types";

/**
 * Eén icoon per categorie. Centraal zodat de homepage-grid, de builder en de
 * gedeelde build-weergave niet uiteenlopen. Het Record-type dwingt af dat er
 * voor elke ComponentType een icoon is.
 */
export const CATEGORY_ICONS: Record<ComponentType, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  gpu: Monitor,
  motherboard: Layers,
  ram: Database,
  storage: HardDrive,
  psu: Zap,
  case: Server,
  cooling: Wind,
  monitor: MonitorPlay,
  keyboard: Keyboard,
  mouse: Mouse,
  headset: Headphones,
  microphone: Mic,
  webcam: Webcam,
  speaker: Speaker,
  casefan: Fan,
  thermalpaste: Syringe,
  soundcard: AudioLines,
  networkcard: Network,
  capturecard: Video,
  os: AppWindow,
  accessory: Cable,
};
