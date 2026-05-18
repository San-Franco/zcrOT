import { cn } from "@/lib/utils"
import CustomBadge from "@/components/shared/custom-badge"

interface Props {
    tabs: Tab[],
    activeTab: string,
    setActiveTab: (tab: string) => void,
    disabled?: boolean
}

export default function SubTabs({ tabs, activeTab, setActiveTab, disabled }: Props) {
    return (
        <div className="border-b border-border">
            <nav className="flex -mb-px space-x-8 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    const isDisabled = tab.disabled

                    return (
                        <button
                            type='button'
                            key={tab.id}
                            onClick={() => !isDisabled && setActiveTab(tab.id)}
                            disabled={isDisabled || disabled}
                            className={cn(
                                "group inline-flex items-center gap-3 px-1 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap shrink-0",
                                isDisabled
                                    ? "cursor-not-allowed opacity-50"
                                    : "cursor-pointer hover:border-muted-foreground/50",
                                "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:content-[''] after:transition-colors",
                                isActive && !isDisabled
                                    ? "after:bg-gradient"
                                    : "after:bg-transparent"
                            )}
                        >
                            <Icon className={cn(
                                "size-5 transition-colors shrink-0",
                                isDisabled
                                    ? "text-muted-foreground/50"
                                    : isActive
                                        ? "text-zcr-blue"
                                        : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <div className="flex flex-col items-start text-left">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "leading-none font-semibold text-base",
                                        isDisabled
                                            ? "text-muted-foreground/50"
                                            : isActive
                                                ? "text-gradient"
                                                : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {tab.label}
                                    </span>
                                    {isDisabled && <CustomBadge value="COMING_SOON" />}
                                </div>
                                {tab.description && <span className="hidden mt-1 text-xs font-normal leading-none lg:inline text-muted-foreground">
                                    {tab.description}
                                </span>}
                            </div>
                        </button>
                    )
                })}
            </nav>
        </div>
    )
}