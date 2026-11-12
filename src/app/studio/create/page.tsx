import type { Metadata } from "next";
import ImageCanvas from "@/features/workspace/ImageCanvas";
export const metadata: Metadata = { title: "Creative canvas" };
export default function CreatePage() {
  return <ImageCanvas />;
}
