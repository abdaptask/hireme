/**
 * Dev utility: completely remove a candidate created while trying the
 * onboarding flow — record, checklist, package, files, messages, and audit.
 *
 * Run: npx tsx --env-file=.env.local scripts/remove-candidate.ts <candidate-id | email>
 *
 * Local testing only. Real candidate deletion is a governed action that needs
 * approval and retention checks (§25, §42).
 */
import { promises as fs } from "node:fs";
import { db } from "@/lib/db";

/** Delete a candidate and every row that references it (several relations are SetNull, not cascade). */
export async function removeCandidate(id: string): Promise<void> {
  const where = { candidateId: id };
  await db.auditEvent.deleteMany({ where });
  await db.document.deleteMany({ where });
  await db.screening.deleteMany({ where });
  await db.training.deleteMany({ where });
  await db.equipment.deleteMany({ where });
  await db.communication.deleteMany({ where });
  await db.exception.deleteMany({ where });
  await db.assignment.deleteMany({ where });
  await db.package.deleteMany({ where: { id: `pkg-${id}` } });
  await db.candidate.delete({ where: { id } }); // payroll / billing readiness cascade
  await fs.rm(`storage/uploads/${id}`, { recursive: true, force: true });
}

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
