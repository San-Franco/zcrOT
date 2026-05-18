export default function BackgroundPattern() {
  return (
    <>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 rounded-full -left-20 h-96 w-96 bg-blue-600 mix-blend-multiply blur-3xl animate-pulse" />
        <div
          className="absolute top-0 rounded-full -right-20 h-96 w-96 bg-purple-600 mix-blend-multiply blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute rounded-full -bottom-20 left-1/3 h-96 w-96 bg-indigo-600 mix-blend-multiply blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
    </>
  );
}
