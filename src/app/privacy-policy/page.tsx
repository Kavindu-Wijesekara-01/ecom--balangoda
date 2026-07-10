import { Metadata } from "next";
import { policies } from "@/lib/policies";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy - Mr. Korea",
  description: "Read the Privacy Policy of Mr. Korea Online Shop.",
};

export default function PrivacyPolicyPage() {
  const policy = policies["privacy-policy"];
  return <PolicyLayout title={policy.title} content={policy.content} />;
}
