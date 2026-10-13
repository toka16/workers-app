import { ServicesStepPage, stepMetadata } from "@/components/dashboard/profile-editor/step-pages";

export const generateMetadata = () => stepMetadata("services");

export default function ServicesStep() {
  return <ServicesStepPage />;
}
