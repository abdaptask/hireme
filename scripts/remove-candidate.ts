/**
 * Dev utility: completely remove a candidate created while trying the
 * onboarding flow — record, checklist, package, files, messages, and audit.
 *
 * Run: npx tsx --env-file=.env.local scripts/remove-candidate.ts <candidate-id | email>
 *
 * Local testing only. Real candidate deletion is a governed action that needs
 * approval and retention checks (§25, §42).
 */
import { db } from "@/lib/db";
import { deleteCandidateCascade } from "@/lib/onboarding/service";

/** Delete a candidate and every row that references it. */
export const removeCandidate = deleteCandidateCascade;

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx --env-file=.env.local scripts/remove-candidate.ts <candidate-id | email>");
    process.exit(1);
  }
  const c = await db.candidate.findFirst({ where: { OR: [{ id: arg }, { email: arg.toLowerCase() }] } });
  if (!c) {
    console.error(`No candidate found for "${arg}".`);
    process.exit(1);
  }
  await removeCandidate(c.id);
  console.log(`Removed ${c.firstName} ${c.lastName} (${c.id}).`);
}

if (process.argv[1]?.includes("remove-candidate")) {
  main().then(() => process.exit(0));
}
