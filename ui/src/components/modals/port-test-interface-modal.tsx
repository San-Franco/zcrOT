import { useState } from "react";
import { BiTime } from "react-icons/bi";
import { BsCloudCheckFill } from "react-icons/bs";
import { FiPlay } from "react-icons/fi";
import { HiOutlineInformationCircle } from "react-icons/hi2";
import { MdCheckCircle, MdError } from "react-icons/md";
import { PiCloudXFill } from "react-icons/pi";
import CustomBadge from "@/components/shared/custom-badge";
import Spinner from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useTestPort from "@/hooks/ports-management/use-test-port";
import { formatDuration, formatPortDate } from "@/lib/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  port: PortItem;
};

export default function PortTestInterfaceModal({ isOpen, onClose, port }: Props) {
  const [lastResult, setLastResult] = useState<PortTestResponse | null>(null);
  const [testHistory, setTestHistory] = useState<PortTestResponse[]>([]);

  const { testPort: runPortTest, testingPort } = useTestPort({
    portId: port.id,
    onSuccess: (result) => {
      setLastResult(result);
      setTestHistory((prev) => [result, ...prev].slice(0, 5));
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="no-scrollbar max-h-[95vh] overflow-y-auto border-dark-border/50 primary-gradient sm:max-w-3xl">
        <DialogHeader className="border-b border-dark-border/50 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            Port {port.port_number} Connectivity Test
          </DialogTitle>
          <DialogDescription>
            Test port availability and binding capability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {lastResult && (
            <div
              className={
                lastResult.success
                  ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4"
                  : "rounded-lg border border-red-500/30 bg-red-500/10 p-4"
              }
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div
                    className={
                      lastResult.success
                        ? "font-medium text-emerald-300"
                        : "font-medium text-red-300"
                    }
                  >
                    {lastResult.success ? "Success" : "Failed"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPortDate(lastResult.test_timestamp)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="font-mono font-medium">
                    {formatDuration(lastResult.duration_ms)}
                  </div>
                </div>
              </div>

              {lastResult.success ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="flex items-start gap-2 text-sm text-emerald-300">
                    <BsCloudCheckFill className="mt-0.5 size-4 shrink-0" />
                    <div>Port {port.port_number} is available and can bind successfully.</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <div className="flex items-start gap-2 text-sm text-red-300">
                    <PiCloudXFill className="mt-0.5 size-4 shrink-0" />
                    <div>{lastResult.error_message}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {testHistory.length > 0 ? (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <BiTime className="size-4" />
                Recent Test History
              </h4>
              <div className="custom-scrollbar max-h-50 space-y-2 overflow-y-auto">
                {testHistory.map((test, index) => (
                  <div
                    key={`${test.test_timestamp}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-dark-bg/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {test.success ? (
                        <MdCheckCircle className="size-4 text-emerald-300" />
                      ) : (
                        <MdError className="size-4 text-red-300" />
                      )}
                      <div>
                        <div className="text-sm">{test.success ? "Success" : "Failed"}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPortDate(test.test_timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-sm">{formatDuration(test.duration_ms)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg border border-amber-500/30 bg-linear-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10">
              <div className="absolute inset-0 pointer-events-none bg-linear-to-br from-amber-500/10 via-transparent to-amber-500/5" />
              <div className="relative p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-amber-500/15 p-2 ring-1 ring-amber-500/30">
                    <HiOutlineInformationCircle className="h-4 w-4 text-amber-300" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-amber-300">Test Information</p>
                    <p className="text-xs leading-relaxed text-amber-100/80">
                      This test attempts to bind to UDP port {port.port_number} to verify it&apos;s available
                      for OT log ingestion. The test does not interfere with existing connections.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-dark-border/50 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Port Status:</span>
              <CustomBadge value={port.status} />
            </div>
            <Button
              type="button"
              onClick={() => runPortTest()}
              disabled={testingPort}
              className="cursor-pointer bg-gradient text-white transition-all duration-300 hover:brightness-110"
            >
              <Spinner isLoading={testingPort} label="Testing...">
                <FiPlay className="size-4" />
                Test Port
              </Spinner>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
