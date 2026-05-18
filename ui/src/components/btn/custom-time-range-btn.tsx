import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import CustomTimeRangeModal from "../modals/custom-time-range-modal";

export default function CustomTimeRangeBtn({ isDisabled }: { isDisabled?: boolean }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    disabled={isDisabled}
                    className="text-white cursor-pointer w-fit bg-gradient hover:brightness-110"
                >
                    Custom
                </Button>
            </DialogTrigger>

            {open && <CustomTimeRangeModal onClose={() => setOpen(false)} />}
        </Dialog>
    )
}