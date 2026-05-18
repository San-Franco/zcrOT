import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Spinner from "@/components/shared/spinner";

type Props = {
  title: string;
  description: string;
  isLoading: boolean;
  loadingLabel: string;
  showOk?: boolean;
  onConfirm?: () => void;
};

export default function ConfirmModal({
  title,
  description,
  isLoading,
  loadingLabel,
  showOk = false,
  onConfirm,
}: Props) {
  return (
    <DialogContent className="primary-gradient border border-dark-border/50 sm:max-w-125">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="whitespace-pre-line text-sm text-muted-foreground">
          {description}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button disabled={isLoading} variant="outline" className="cursor-pointer">
            {showOk ? "Close" : "Cancel"}
          </Button>
        </DialogClose>
        {!showOk && onConfirm && (
          <Button
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
            className="cursor-pointer bg-gradient text-white transition-all duration-300 hover:brightness-110"
          >
            <Spinner isLoading={isLoading} label={loadingLabel}>
              Confirm
            </Spinner>
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}
