import { cn } from "@/lib/utils"
import type { IconType } from "react-icons"

interface Props {
    title: string
    subTitle: string
    icon?: IconType
    size?: "sm" | "lg"
}

export default function PageHeader({ title, subTitle, icon: Icon, size = "lg" }: Props) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    {Icon && <div className="items-center justify-center hidden mt-1 rounded-md sm:flex size-10 sm:size-11 bg-zcr-blue/10">
                        <Icon className="size-6 text-zcr-blue" />
                    </div>}
                    <h1 className={cn(size === 'lg' ? "text-2xl md:text-3xl" : "text-xl md:text-2xl", "font-medium tracking-tight")}>{title}</h1>
                </div>
                <p className={cn(size === 'lg' ? "text-sm md:text-base" : "text-sm", "text-muted-foreground line-clamp-2")}>
                    {subTitle}
                </p>
            </div>
        </div>
    )
}
