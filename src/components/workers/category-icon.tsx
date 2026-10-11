import {
  Axe,
  DoorOpen,
  Droplets,
  Grid3x3,
  Hammer,
  House,
  KeyRound,
  Layers,
  PaintRoller,
  Sofa,
  Sparkles,
  Thermometer,
  Trees,
  Truck,
  WashingMachine,
  Wrench,
  Zap,
  type LucideProps,
} from "lucide-react";

// Explicit map keeps the bundle small (no dynamic import of the whole icon set).
const ICONS = {
  droplets: Droplets,
  zap: Zap,
  sparkles: Sparkles,
  "paint-roller": PaintRoller,
  hammer: Hammer,
  axe: Axe,
  "grid-3x3": Grid3x3,
  layers: Layers,
  thermometer: Thermometer,
  "washing-machine": WashingMachine,
  "key-round": KeyRound,
  trees: Trees,
  truck: Truck,
  house: House,
  sofa: Sofa,
  "door-open": DoorOpen,
  wrench: Wrench,
} as const;

export function CategoryIcon({ icon, ...props }: { icon: string } & LucideProps) {
  const Icon = ICONS[icon as keyof typeof ICONS] ?? Wrench;
  return <Icon aria-hidden {...props} />;
}
