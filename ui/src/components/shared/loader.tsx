import { cn } from "@/lib/utils"

interface Props {
    label?: string
    type?: "main" | "custom"
    otherClasses?: string
}

export default function Loader({ label, type = 'main', otherClasses }: Props) {
    if (type === 'main') {
        return (
            <div className="absolute inset-0 flex-center z-1000 bg-dark-bg/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16" >
                        <div className="absolute inset-0 border-2 rounded-full border-dark-border/20"></div>
                        <div className="absolute inset-0 border-2 border-transparent rounded-full border-t-zcr-blue border-r-logo-two animate-spin"></div>
                        <div className="absolute border-2 border-transparent rounded-full inset-2 border-b-logo-three border-l-logo-four animate-spin" style={{ animationDirection: 'reverse' }}></div>
                    </div >
                    {label
                        ? <p className="text-base font-medium">
                            <span className="text-dark-text">{label}</span>
                        </p>
                        : <p className="text-base font-medium">
                            <span className="text-dark-text">Loading zcr</span>
                            <span className="font-bold text-gradient">OT</span>
                        </p>
                    }
                </ div>
            </div>
        )
    }
    return (
        <div className={cn("flex flex-col items-center gap-4", otherClasses)}>
            <div className="relative w-16 h-16" >
                <div className="absolute inset-0 border-2 rounded-full border-dark-border/20"></div>
                <div className="absolute inset-0 border-2 border-transparent rounded-full border-t-zcr-blue border-r-logo-two animate-spin"></div>

                <div className="absolute border-2 border-transparent rounded-full inset-2 border-b-logo-three border-l-logo-four animate-spin" style={{ animationDirection: 'reverse' }}></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
                {label}
            </p>
        </ div>
    )
}