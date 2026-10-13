import { PortfolioStepPage, stepMetadata } from "@/components/dashboard/profile-editor/step-pages";

export const generateMetadata = () => stepMetadata("portfolio");

export default function PortfolioStep() {
  return <PortfolioStepPage />;
}
