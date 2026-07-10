import { Metadata } from "next";
import { policies } from "@/lib/policies";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Delivery & Shipping Info - Mr. Korea",
  description: "Read the Delivery & Shipping Info of Mr. Korea Online Shop.",
};

export default function DeliveryInfoPage() {
  const policy = policies["delivery-info"];
  return <PolicyLayout title={policy.title} content={policy.content} />;
}
