import { FieldsStepPage, stepMetadata } from "@/components/dashboard/profile-editor/step-pages";

export const generateMetadata = () => stepMetadata("area");

export default function AreaStep() {
  return <FieldsStepPage step="area" />;
}
