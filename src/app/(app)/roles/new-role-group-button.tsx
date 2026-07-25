"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NameDialog } from "@/components/shared/name-dialog";
import { createRoleGroup } from "./actions";

export function NewRoleGroupButton() {
  return (
    <NameDialog
      triggerRender={<Button />}
      triggerContent={
        <>
          <Plus /> Add role group
        </>
      }
      title="New role group"
      label="Group name"
      action={createRoleGroup}
      submitLabel="Create group"
    />
  );
}
