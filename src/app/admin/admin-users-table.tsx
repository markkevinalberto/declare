"use client";

import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { adminDeleteUser } from "./actions";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  orgName: string | null;
  active: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  isSuperAdmin: boolean;
};

export function AdminUsersTable({
  rows,
  currentUserId,
}: {
  rows: AdminUserRow[];
  currentUserId: string;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name / email</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Last active</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{row.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {row.orgName ?? (
                  <span className="text-muted-foreground">No organization</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={row.role === "admin" ? "default" : "outline"}>
                  {row.role}
                </Badge>
                {row.isSuperAdmin ? (
                  <Badge variant="secondary" className="ml-1">
                    super admin
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.lastSignInAt
                  ? formatDistanceToNow(new Date(row.lastSignInAt), {
                      addSuffix: true,
                    })
                  : "Never"}
              </TableCell>
              <TableCell>
                {row.id !== currentUserId ? (
                  <ConfirmDeleteButton
                    action={async () => {
                      const result = await adminDeleteUser(row.id);
                      if (result.error) toast.error(result.error);
                      else toast.success(`${row.name} deleted`);
                    }}
                    title={`Delete ${row.name}?`}
                    description="This permanently deletes their login and profile. If they're their organization's only admin, another member is promoted to admin first so it isn't left unmanaged."
                  />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
