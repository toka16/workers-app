import { FieldsStepPage, stepMetadata } from "@/components/dashboard/profile-editor/step-pages";

export const generateMetadata = () => stepMetadata("contacts");

export default function ContactsStep() {
  return <FieldsStepPage step="contacts" />;
}
