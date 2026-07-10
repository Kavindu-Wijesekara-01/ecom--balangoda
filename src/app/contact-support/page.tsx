import { Metadata } from "next";
import { policies } from "@/lib/policies";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Contact Support - Mr. Korea",
  description: "Get in touch with Mr. Korea Online Shop customer support.",
};

export default function ContactSupportPage() {
  const policy = policies["contact-support"];
  return <PolicyLayout title={policy.title} content={policy.content} />;
}
