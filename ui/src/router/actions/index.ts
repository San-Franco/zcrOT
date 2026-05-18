import { authApi } from "@/api";
import useUserStore from "@/stores/user-store";
import { AxiosError } from "axios";
import { redirect, type ActionFunctionArgs } from "react-router";
import { toast } from "sonner";

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const extractDetailObject = (
  errorData: ApiErrorResponse | undefined,
): Record<string, unknown> | undefined => {
  const detail = errorData?.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    return detail as Record<string, unknown>;
  }
  return undefined;
};

const extractApiErrorMessage = (errorData: ApiErrorResponse | undefined): string | undefined => {
  if (!errorData) {
    return undefined;
  }

  if (typeof errorData.error?.message === "string" && errorData.error.message.trim()) {
    return errorData.error.message.trim();
  }

  if (typeof errorData.detail === "string" && errorData.detail.trim()) {
    return errorData.detail.trim();
  }

  const detailObject = extractDetailObject(errorData);
  if (detailObject && typeof detailObject.message === "string" && detailObject.message.trim()) {
    return detailObject.message.trim();
  }

  return undefined;
};

const extractLockoutMeta = (errorData: ApiErrorResponse | undefined) => {
  const detailObject = extractDetailObject(errorData);
  if (!detailObject) {
    return {
      remainingMinutes: undefined,
      remainingSeconds: undefined,
      lockoutDurationMinutes: undefined,
      lockedByAdmin: false,
    };
  }

  return {
    remainingMinutes: toNumberOrUndefined(detailObject.remaining_minutes),
    remainingSeconds: toNumberOrUndefined(detailObject.remaining_seconds),
    lockoutDurationMinutes: toNumberOrUndefined(detailObject.lockout_duration_minutes),
    lockedByAdmin: detailObject.locked_by_admin === true,
  };
};

export const loginAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestUrl = new URL(request.url);
  const redirectTo = requestUrl.searchParams.get("redirect") || "/dashboard";

  try {
    const response = await authApi.post<AuthSessionResponse>("auth/login", {
      username: username.trim(),
      password,
    });

    if (response.status === 200 && response.data) {
      const { user } = response.data;

      useUserStore.getState().setAuth(user);

      toast.success(`Welcome back, ${user.username}.`, {
        description: 'Successfully Logged In.',
      });

      return redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
    }

    return {
      message: "Unexpected demo auth response.",
      error: {
        message: "Unexpected demo auth response.",
      },
    } satisfies LoginActionData;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const errorData = error.response?.data as ApiErrorResponse | undefined;
      const apiMessage = extractApiErrorMessage(errorData);
      const defaultMessage = apiMessage || "Login failed. Please check your credentials.";

      if (status === 401) {
        return {
          message: apiMessage || "Invalid username/email or password.",
          error: {
            code: "UNAUTHORIZED",
            message: apiMessage || "Invalid username/email or password.",
            status_code: 401,
          },
        } satisfies LoginActionData;
      }

      if (status === 423) {
        const lockoutMeta = extractLockoutMeta(errorData);
        return {
          message: apiMessage || "Your account is locked. Please try again later.",
          error: {
            code: "ACCOUNT_LOCKED",
            message: apiMessage || "Your account is locked. Please try again later.",
            status_code: 423,
            remaining_minutes: lockoutMeta.remainingMinutes,
            remaining_seconds: lockoutMeta.remainingSeconds,
            lockout_duration_minutes: lockoutMeta.lockoutDurationMinutes,
            locked_by_admin: lockoutMeta.lockedByAdmin,
          },
        } satisfies LoginActionData;
      }

      if (status === 403) {
        return {
          message: apiMessage || "Access denied.",
          error: {
            code: "FORBIDDEN",
            message: apiMessage || "Access denied.",
            status_code: 403,
          },
        } satisfies LoginActionData;
      }

      return {
        message: defaultMessage,
        error: {
          code: errorData?.error?.code || "UNKNOWN_ERROR",
          message: defaultMessage,
          status_code: status || 500,
        },
      } satisfies LoginActionData;
    }

    return {
      message: "An unexpected error occurred during login.",
      error: {
        message: "An unexpected error occurred during login.",
      },
    } satisfies LoginActionData;
  }
};
