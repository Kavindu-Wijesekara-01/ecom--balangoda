import { Metadata } from "next";
import { policies } from "@/lib/policies";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Return & Refund Policy - Mr. Korea",
  description: "Read the Return & Refund Policy of Mr. Korea Online Shop.",
};

export default function ReturnPolicyPage() {
  const policy = policies["return-policy"];
  return <PolicyLayout title={policy.title} content={policy.content} />;
}
