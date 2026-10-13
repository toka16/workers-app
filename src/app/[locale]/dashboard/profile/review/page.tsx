import { ReviewStepPage, stepMetadata } from "@/components/dashboard/profile-editor/step-pages";

export const generateMetadata = () => stepMetadata("review");

export default function ReviewStep() {
  return <ReviewStepPage />;
}
