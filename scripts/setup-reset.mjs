// Put the app back to "fresh install" so the /setup wizard runs again.
// Keeps only the model choice; clears the owner flag and the measured voice
// baseline too, because both are personal to whoever ran the app before.
// Leaves the database
// and your chats alone. A copy of the old settings is written next to it.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const settingsPath = path.join(root, "data", "settings.json");
const envPath = path.join(root, ".env.local");

if (!existsSync(settingsPath)) {
  console.log("No data/settings.json — the wizard will run already.");
  process.exit(0);
}
const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = settingsPath + ".before-reset-" + stamp;
copyFileSync(settingsPath, backup);

for (const key of ["auth", "selfAliases", "displayName", "licenceKey", "setupCompletedAt", "ownerMode", "voiceBaseline"]) {
  delete settings[key];
}
writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log("Setup cleared. Backup: " + path.basename(backup));

if (existsSync(envPath) && /^\s*APP_PASSWORD\s*=\s*\S/m.test(readFileSync(envPath, "utf-8"))) {
  console.log(
    "\n⚠ .env.local still sets APP_PASSWORD — the app treats that as 'already set up'\n" +
      "  and will skip the wizard. Comment that line out to see /setup."
  );
}
