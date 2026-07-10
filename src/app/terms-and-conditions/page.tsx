import { Metadata } from "next";
import { policies } from "@/lib/policies";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Business Terms & Conditions - Mr. Korea",
  description: "Read the Business Terms & Conditions of Mr. Korea Online Shop.",
};

export default function TermsAndConditionsPage() {
  const policy = policies["terms-and-conditions"];
  return <PolicyLayout title={policy.title} content={policy.content} />;
}
