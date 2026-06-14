import { redirect } from "next/navigation";

// The OneSky experience (marketing, input app, reader, account) lives at /welcome.
// The root sends people straight there.
export default function Home() {
  redirect("/welcome");
}
