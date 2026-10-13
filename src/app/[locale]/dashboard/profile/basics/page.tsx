import { FieldsStepPage, stepMetadata } from "@/components/dashboard/profile-editor/step-pages";

export const generateMetadata = () => stepMetadata("basics");

export default function BasicsStep() {
  return <FieldsStepPage step="basics" />;
}
