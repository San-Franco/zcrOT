import error from "@/assets/images/error.webp";
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8 text-center text-sm text-foreground md:text-base">
      <img src={error} alt="Not found illustration" className="size-87.5" />
      <p className="mb-2 text-lg font-semibold text-white">Sorry!</p>
      <p className="mx-auto mb-5 max-w-lg text-sm font-light text-muted-foreground">
        The page you are looking for does not exist.
        <br />
        You may have mistyped the address or the page may have moved.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="cursor-pointer rounded-full bg-gradient px-5 py-2 text-white transition-all duration-300 hover:brightness-110"
      >
        &larr; Go Back
      </button>
    </div>
  );
}
