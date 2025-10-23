import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import PreviewClient from "./PreviewClient";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const generation = await db.generation.findUnique({
    where: { id },
  });

  if (!generation || generation.status !== "completed") {
    notFound();
  }

  return <PreviewClient code={generation.code} css={generation.css} />;
}

