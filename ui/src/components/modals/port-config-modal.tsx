import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Spinner from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { portConfigSchema, type PortConfigSchemaValues } from "@/lib/validators";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  port: PortItem;
  isSaving: boolean;
  onSave: (portId: number, values: PortFormValues) => Promise<unknown> | void;
};

export default function PortConfigModal({
  isOpen,
  onClose,
  port,
  isSaving,
  onSave,
}: Props) {
  const form = useForm<PortConfigSchemaValues>({
    resolver: zodResolver(portConfigSchema),
    defaultValues: {
      label: port.label || "",
      description: port.description || "",
      status: port.status,
    },
  });

  useEffect(() => {
    form.reset({
      label: port.label || "",
      description: port.description || "",
      status: port.status,
    });
  }, [form, port]);

  const handleSubmit = async (values: PortConfigSchemaValues) => {
    await onSave(port.id, {
      label: values.label.trim(),
      description: values.description.trim(),
      status: values.status,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="no-scrollbar max-h-[95vh] overflow-y-auto border-dark-border/50 primary-gradient sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Port Configuration</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="rounded-lg border border-dark-border/50 bg-dark-bg/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Port Number</span>
              </div>
              <div className="font-mono text-2xl font-bold text-zcr-blue">{port.port_number}</div>
              <p className="mt-2 text-xs text-muted-foreground">
                Port number is fixed. Request a new port to use a different value.
              </p>
            </div>

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Label <span className="text-red-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Power Site A"
                      className="min-h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status <span className="text-red-600">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="min-h-11 w-full cursor-pointer">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent
                      className="z-[1001] border-dark-border/50 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg"
                      position="popper"
                      align="start"
                      side="bottom"
                      sideOffset={0}
                    >
                      <SelectItem value="ACTIVE" className="cursor-pointer">
                        Active
                      </SelectItem>
                      <SelectItem value="INACTIVE" className="cursor-pointer">
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Optional description for this managed port"
                      maxLength={1000}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex items-center justify-end gap-3 border-t border-dark-border/50 pt-4">
              <DialogClose asChild>
                <Button disabled={isSaving} className="cursor-pointer" type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                disabled={isSaving}
                type="submit"
                className="cursor-pointer bg-gradient text-white transition-all duration-300 hover:brightness-110"
              >
                <Spinner isLoading={isSaving} label="Updating...">
                  Update Port
                </Spinner>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
