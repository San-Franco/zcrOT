import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useError from "@/hooks/system/use-error";
import { loginSchema, type LoginFormValues } from "@/lib/validators";
import { LockKeyhole, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { useActionData, useLocation, useNavigation, useSubmit } from "react-router";
import Spinner from "../shared/spinner";

const LOGIN_LOCKOUT_STORAGE_KEY = "zcrot-login-lockout";

const formatLockoutCountdown = (remainingSeconds: number) => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const parseLockoutFromStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LOGIN_LOCKOUT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { until_epoch_ms?: number };
    if (typeof parsed.until_epoch_ms !== "number" || !Number.isFinite(parsed.until_epoch_ms)) {
      window.localStorage.removeItem(LOGIN_LOCKOUT_STORAGE_KEY);
      return null;
    }

    if (parsed.until_epoch_ms <= Date.now()) {
      window.localStorage.removeItem(LOGIN_LOCKOUT_STORAGE_KEY);
      return null;
    }

    return parsed.until_epoch_ms;
  } catch {
    window.localStorage.removeItem(LOGIN_LOCKOUT_STORAGE_KEY);
    return null;
  }
};

export default function LoginForm() {
  const submit = useSubmit();
  const location = useLocation();
  const navigation = useNavigation();
  const actionData = useActionData() as LoginActionData | undefined;
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<LoginFormValues>({
    username: "",
    password: "",
  });
  const [lockoutUntilEpochMs, setLockoutUntilEpochMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});

  const isWorking = navigation.state === "submitting";
  const lockoutRemainingSeconds = useMemo(
    () => (lockoutUntilEpochMs ? Math.max(Math.ceil((lockoutUntilEpochMs - nowMs) / 1000), 0) : 0),
    [lockoutUntilEpochMs, nowMs],
  );
  const isLockedOut = lockoutRemainingSeconds > 0;

  useError(actionData, actionData?.message || "");

  const updateField = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (values: LoginFormValues) => {
    submit(values, {
      method: "post",
      action: `${location.pathname}${location.search}`,
    });
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLockedOut) {
      return;
    }

    const result = loginSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setValidationErrors({
        username: fieldErrors.username?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setValidationErrors({});
    handleSubmit(result.data);
  };

  useEffect(() => {
    const persistedLockout = parseLockoutFromStorage();
    if (persistedLockout) {
      setLockoutUntilEpochMs(persistedLockout);
      setNowMs(Date.now());
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== LOGIN_LOCKOUT_STORAGE_KEY) {
        return;
      }

      const persistedLockout = parseLockoutFromStorage();
      setLockoutUntilEpochMs(persistedLockout);
      setNowMs(Date.now());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const lockoutSeconds = actionData?.error?.remaining_seconds;
    if (actionData?.error?.code !== "ACCOUNT_LOCKED" || typeof lockoutSeconds !== "number" || lockoutSeconds <= 0) {
      return;
    }

    const nextLockoutUntil = Date.now() + lockoutSeconds * 1000;
    setLockoutUntilEpochMs(nextLockoutUntil);
    setNowMs(Date.now());

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        LOGIN_LOCKOUT_STORAGE_KEY,
        JSON.stringify({ until_epoch_ms: nextLockoutUntil }),
      );
    }
  }, [actionData?.error?.code, actionData?.error?.remaining_seconds]);

  useEffect(() => {
    if (!lockoutUntilEpochMs) {
      return;
    }

    const tick = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(tick);
    };
  }, [lockoutUntilEpochMs]);

  useEffect(() => {
    if (!lockoutUntilEpochMs) {
      return;
    }

    if (lockoutUntilEpochMs > nowMs) {
      return;
    }

    setLockoutUntilEpochMs(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LOGIN_LOCKOUT_STORAGE_KEY);
    }
  }, [lockoutUntilEpochMs, nowMs]);

  return (
    <div className="mx-auto rounded-xl border-[1.5px] primary-gradient p-8">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-normal text-slate-200" htmlFor="username">
              Username
              <span className="ml-1 text-red-600">*</span>
            </label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                id="username"
                name="username"
                value={values.username}
                onChange={(event) => updateField("username", event.target.value)}
                placeholder="Enter your username or email"
                autoComplete="username"
                disabled={isWorking}
                className="min-h-13 w-full pl-12 placeholder:text-[15px]"
              />
            </div>
            {validationErrors.username ? (
              <p className="text-sm text-destructive">{validationErrors.username}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-normal text-slate-200" htmlFor="password">
              Password
              <span className="ml-1 text-red-600">*</span>
            </label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                id="password"
                name="password"
                value={values.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                type={showPassword ? "text" : "password"}
                disabled={isWorking}
                className="min-h-13 w-full pl-12 pr-10 placeholder:text-[15px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-4.25 cursor-pointer text-muted-foreground"
                disabled={isWorking}
              >
                {showPassword ? (
                  <VscEyeClosed className="h-5 w-5 text-slate-400 transition-colors hover:text-slate-200" />
                ) : (
                  <VscEye className="h-5 w-5 text-slate-400 transition-colors hover:text-slate-200" />
                )}
                <span className="sr-only">Toggle password visibility</span>
              </button>
            </div>
            {validationErrors.password ? (
              <p className="text-sm text-destructive">{validationErrors.password}</p>
            ) : null}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isWorking}
          className="min-h-14 w-full cursor-pointer shimmer-effect rounded-lg bg-gradient text-base font-medium text-white transition-all duration-300 hover:brightness-110"
        >
          <Spinner isLoading={isWorking} label="Authenticating...">
            Access zcrOT
          </Spinner>
        </Button>

        {isLockedOut ? (
          <p className="text-center text-sm text-red-500">
            Account locked. Try again in {formatLockoutCountdown(lockoutRemainingSeconds)}.
          </p>
        ) : null}
      </form>
    </div>
  );
}
