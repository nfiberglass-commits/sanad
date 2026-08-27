import { getLang } from "@/lib/lang-server";
import SetupWizard from "@/components/SetupWizard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const lang = await getLang();
  return <SetupWizard lang={lang} />;
}
