import { AxiosError } from "axios";
import { SlRefresh } from "react-icons/sl";
import { toast } from "sonner";
import Spinner from "../shared/spinner";
import { Button } from "../ui/button";

interface RateLimitErrorDetail {
    error?: string;
    message?: string;
    remaining?: number;
    reset_in_seconds?: number;
}

interface Props {
    height?: string,
    isDisabled: boolean,
    isRefreshing?: boolean,
    setIsRefreshing?: (value: boolean) => void,
    onAction?: () => void | Promise<unknown>
}

export default function RefreshBtn({ height = "h-8", isDisabled, isRefreshing, setIsRefreshing, onAction }: Props) {
    const handleManualRefresh = async () => {
        setIsRefreshing?.(true);
        try {
            // ? Wait for the action to complete (handles both sync and async actions)
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await onAction?.();

            toast.success("Success", {
                description: "Successfully refreshed."
            });
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 429) {
                const detail = error.response.data?.detail as RateLimitErrorDetail;
                const resetTime = detail?.reset_in_seconds || 300;
                const minutes = Math.ceil(resetTime / 60);

                toast.error("Rate Limit Exceeded", {
                    description: detail?.message || `You can only refresh 3 times per 5 minutes. Please wait ${minutes} minute(s).`,
                    duration: 5000,
                });
            } else {
                toast.error("Refresh Failed", {
                    description: "An error occurred while refreshing. Please try again.",
                });
            }
            console.error("Refresh error:", error);
        } finally {
            setIsRefreshing?.(false);
        }
    };

    return (
        <Button
            onClick={handleManualRefresh}
            disabled={isDisabled}
            type="button"
            variant="outline"
            className={`${height} group w-fit cursor-pointer items-center gap-2 border-emerald-300/80 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-600/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50`}
        >
            <Spinner LoaderIcon={SlRefresh} isLoading={!!isRefreshing} label="Refreshing...">
                <SlRefresh className="size-3.5 group-hover:rotate-180 transition-transform duration-500" />
                Refresh
            </Spinner>
        </Button>
    )
}