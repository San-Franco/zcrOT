import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Spinner from "../shared/spinner";

type Props = {
  onConfirm: () => void;
  isLoading?: boolean;
};

export default function LogoutModal({ onConfirm, isLoading = false }: Props) {
  return (
    <DialogContent className="primary-gradient z-1000 border sm:max-w-106.25">
      <DialogHeader>
        <DialogTitle>Logout Confirmation.</DialogTitle>
        <DialogDescription>
          Are you sure you want to log out?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" className="cursor-pointer" disabled={isLoading}>
            Cancel
          </Button>
        </DialogClose>
        <Button variant="destructive" className="cursor-pointer" onClick={onConfirm} disabled={isLoading}>
          <Spinner isLoading={isLoading} label="Logging out...">
            Logout
          </Spinner>
        </Button>
      </DialogFooter>
    </DialogContent >
  );
}
