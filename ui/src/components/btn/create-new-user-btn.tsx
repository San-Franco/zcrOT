import { useState } from "react";
import { IoMdPersonAdd } from "react-icons/io";
import CreateEditUserModal from "@/components/modals/create-edit-user-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { createUserManagementSchema } from "@/lib/validators";
import { CREATE_USER_DEFAULT_VALUES } from "@/lib/utils";

type Props = {
  onCreate: (
    values: UserManagementUpsertFormValues,
  ) => boolean | void | Promise<boolean | void>;
  onBeforeOpen?: () => boolean;
  isDisabled?: boolean;
  isSubmitting?: boolean;
};

export default function CreateNewUserBtn({
  onCreate,
  onBeforeOpen,
  isDisabled = false,
  isSubmitting = false,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={isDisabled}
          type="button"
          onClick={(event) => {
            if (onBeforeOpen?.() === false) {
              event.preventDefault();
            }
          }}
          className="min-h-11 cursor-pointer gap-2 bg-gradient text-white transition-all duration-300 hover:brightness-110"
        >
          <IoMdPersonAdd className="size-4.5" />
          Create New User
        </Button>
      </DialogTrigger>
      <CreateEditUserModal
        formType="CREATE"
        schema={createUserManagementSchema}
        defaultValues={CREATE_USER_DEFAULT_VALUES}
        onSubmit={onCreate}
        isSubmitting={isSubmitting}
        onClose={() => setCreateOpen(false)}
        isOpen={createOpen}
      />
    </Dialog>
  );
}
