import { t, type Lang } from "@/lib/i18n";

// The Sanad logo: white wordmark on the dark green brand tile.
// Kept in one place so every screen shows an identical mark.
export const BRAND_GREEN = "#1F5C3F";

export default function BrandMark({
  lang,
  size = "sm",
}: {
  lang: Lang;
  size?: "sm" | "lg";
}) {
  const sizing =
    size === "lg" ? "text-2xl px-5 py-2 rounded-lg" : "text-base px-3 py-1 rounded-md";
  return (
    <span
      className={`inline-flex items-center font-semibold text-white leading-none ${sizing}`}
      style={{ backgroundColor: BRAND_GREEN }}
    >
      {t(lang, "brand")}
    </span>
  );
}
