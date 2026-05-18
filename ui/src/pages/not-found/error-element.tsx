import error from "@/assets/images/error.webp";
import { Link } from "react-router";

export default function ErrorElement() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8 text-center text-sm text-foreground md:text-base">
      <img src={error} alt="Error illustration" className="size-[350px]" />
      <p className="mb-2 text-lg font-semibold text-white">Whoops!</p>
      <p className="mx-auto mb-5 max-w-md text-sm font-light text-muted-foreground">
        Even our code can have a bad day. Give it another shot.
      </p>
      <Link
        to="/login"
        className="rounded-full bg-gradient px-5 py-2 text-white transition-all duration-300 hover:brightness-110"
      >
        Retry Request
      </Link>
    </div>
  );
}
