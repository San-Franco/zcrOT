import BackgroundPattern from "@/components/auth/background-pattern";
import Footer from "@/components/auth/footer";
import Header from "@/components/auth/header";
import LoginForm from "@/components/auth/login-form";
import useTitle from "@/hooks/system/use-title";

export default function LoginPage() {
  useTitle("Login");

  return (
    <section className="relative min-h-screen overflow-hidden bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
      <BackgroundPattern />
      <div className="relative flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-10">
          <Header />
          <LoginForm />
          <Footer />
        </div>
      </div>
    </section>
  );
}
