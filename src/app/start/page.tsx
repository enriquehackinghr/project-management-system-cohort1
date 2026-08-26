import { redirect } from "next/navigation";

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (next) {
    redirect(`/signup?next=${encodeURIComponent(next)}`);
  }
  redirect("/signup");
}
