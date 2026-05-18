import cat from '@/assets/lotties/cat.json';
import secure from "@/assets/lotties/secure.json"
import Lottie from "lottie-react";
import fail from '@/assets/lotties/fail.json'

interface Props {
    label: string,
    description?: string,
    classesName?: string,
    lottie?: "cat" | "secure" | "fail"
}

export default function Empty({ label, description, classesName = "w-[200px] h-[150px] lg:h-[200px]", lottie = "cat" }: Props) {
    const lotties = { cat, secure, fail }

    return (
        <div className='flex flex-col items-center justify-center gap-1.5 text-center'>
            <Lottie
                className={classesName}
                animationData={lotties[lottie]}
                loop={true}
                autoplay={true}
            />
            <p className='text-sm font-medium text-center sm:text-base'>{label}</p>
            {description && <span className='max-w-lg text-xs text-center text-muted-foreground'>{description}</span>}
        </div>
    );
}
