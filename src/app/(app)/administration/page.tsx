"use client";

import { useRouter } from "next/navigation";
import { Eye, RotateCcw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPersona, NAV_SECTIONS } from "@/lib/nav";
import { ADMIN_ROLE, isExternalRole, ROLES, type RoleId } from "@/lib/roles";
import { useEntitlements } from "@/components/providers/entitlements-provider";
import { cn } from "@/lib/utils";

export default function AdministrationPage() {
  const router = useRouter();
  const {
    visibility,
    setVisible,
    setRoleAll,
    resetRole,
    resetAll,
    setViewAs,
    viewAs,
  } = useEntitlements();

  function previewAs(role: RoleId) {
    setViewAs(role);
    router.push(isExternalRole(role) ? getPersona(role).home : "/command-center");
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Administration"
        description="Roles, permissions & navigation visibility (§42, §121.7)."
        actions={
          <Button variant="outline" size="sm" onClick={resetAll}>
            <RotateCcw className="size-4" /> Reset all to defaults
          </Button>
        }
      />

      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h2 className="text-section-heading">Navigation visibility</h2>
            <p className="text-muted-foreground text-sm">
              Show or hide each navigation section per role. Hidden items don&apos;t
              appear in the sidebar, command palette, or quick-create for that
              role. Saved locally now; becomes account-backed when auth is wired.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Eye className="size-3" /> Viewing as {viewAs}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="bg-card sticky left-0 z-10 px-4 py-2.5 text-left font-medium">
                  Navigation item
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role.id}
                    className="px-3 py-2.5 text-center align-bottom font-medium whitespace-nowrap"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{role.label}</span>
                      {role.id === ADMIN_ROLE ? (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-normal"
                        >
                          full access
                        </Badge>
                      ) : (
                        <RoleColumnMenu
                          onAll={() => setRoleAll(role.id, true)}
                          onNone={() => setRoleAll(role.id, false)}
                          onReset={() => resetRole(role.id)}
                          onPreview={() => previewAs(role.id)}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NAV_SECTIONS.map((section) => (
                <SectionRows
                  key={section.id}
                  sectionLabel={section.label}
                  items={section.items.map((i) => ({
                    id: i.id,
                    label: i.label,
                  }))}
                  visibility={visibility}
                  onToggle={setVisible}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}

function RoleColumnMenu({
  onAll,
  onNone,
  onReset,
  onPreview,
}: {
  onAll: () => void;
  onNone: () => void;
  onReset: () => void;
  onPreview: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-[10px] underline-offset-2 hover:underline"
          />
        }
      >
        bulk · preview
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        <DropdownMenuItem onClick={onAll}>Show all</DropdownMenuItem>
        <DropdownMenuItem onClick={onNone}>Hide all</DropdownMenuItem>
        <DropdownMenuItem onClick={onReset}>Reset to default</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPreview}>
          <Eye className="size-4" /> Preview as this role
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SectionRows({
  sectionLabel,
  items,
  visibility,
  onToggle,
}: {
  sectionLabel: string;
  items: { id: string; label: string }[];
  visibility: Record<RoleId, Record<string, boolean>>;
  onToggle: (role: RoleId, itemId: string, value: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-muted/40 border-b">
        <td
          colSpan={ROLES.length + 1}
          className="text-data-label sticky left-0 px-4 py-1.5"
        >
          {sectionLabel}
        </td>
      </tr>
      {items.map((item) => (
        <tr key={item.id} className="hover:bg-muted/30 border-b last:border-0">
          <td className="bg-card sticky left-0 z-10 px-4 py-2 font-medium">
            {item.label}
          </td>
          {ROLES.map((role) => {
            const checked = visibility[role.id]?.[item.id] ?? false;
            const locked = role.id === ADMIN_ROLE;
            return (
              <td key={role.id} className="px-3 py-2 text-center">
                <input
                  type="checkbox"
                  className={cn(
                    "accent-primary size-4 align-middle",
                    locked && "cursor-not-allowed opacity-60",
                  )}
                  checked={locked ? true : checked}
                  disabled={locked}
                  aria-label={`${item.label} visible to ${role.label}`}
                  onChange={(e) =>
                    !locked && onToggle(role.id, item.id, e.target.checked)
                  }
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
