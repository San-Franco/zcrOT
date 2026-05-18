import { ChevronUp } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import { Button } from "../ui/button";

export default function ScrollTopBtn({ scrollContainerRef }: { scrollContainerRef?: RefObject<HTMLDivElement> }) {
    const [showBtn, setShowBtn] = useState(false);

    useEffect(() => {
        const el = scrollContainerRef?.current || window;

        const handleScroll = () => {
            const scrollTop = scrollContainerRef?.current
                ? scrollContainerRef.current.scrollTop
                : window.scrollY;
            setShowBtn(scrollTop > 50);
        };

        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, [scrollContainerRef]);

    const scrollToTop = () => {
        if (scrollContainerRef?.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="group">
            <Button
                onClick={scrollToTop}
                type="button"
                variant="outline"
                size="icon"
                id="to-top"
                className={`${showBtn ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} 
                    transition-opacity duration-300 rounded-full cursor-pointer flex fixed bottom-5 right-5 z-10 
                    items-center justify-center bg-gradient border-none hover:opacity-90`}>
                <ChevronUp className="w-4.5 text-white" />
            </Button>
        </div>
    );
}