import { z } from "zod";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_SPECIAL_CHAR_REGEX = /[@$!%*?&#^()_+=\-[\]{}|\\:;"'<>,.?/~`]/;

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username or email is required.")
    .min(3, "Username or email must be at least 3 characters."),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(16, "Password must be at most 16 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(PASSWORD_SPECIAL_CHAR_REGEX, "Password must contain at least one special character"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const portConfigSchema = z.object({
  label: z.string().trim().min(1, "Label is required.").max(255, "Label must be 255 characters or fewer."),
  description: z.string().max(1000, "Description must be 1000 characters or fewer."),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type PortConfigSchemaValues = z.infer<typeof portConfigSchema>;

const userManagementBaseSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(50, "Username must be 50 characters or fewer."),
  email: z
    .string()
    .trim()
    .max(120, "Email must be 120 characters or fewer.")
    .regex(EMAIL_REGEX, "Please enter a valid email address."),
  role: z.enum(["admin", "viewer"], {
    message: "Role is required.",
  }),
  status: z.enum(["active", "inactive", "locked", "pending_verification"], {
    message: "Status is required.",
  }),
  notificationEnabled: z.boolean(),
});

export const createUserManagementSchema = userManagementBaseSchema
  .extend({
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(PASSWORD_SPECIAL_CHAR_REGEX, "Password must contain at least one special character"),
    confirmPassword: z
      .string()
      .min(1, "Confirm password is required."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export const editUserManagementSchema = userManagementBaseSchema;

export type CreateUserManagementSchemaValues = z.infer<typeof createUserManagementSchema>;
export type EditUserManagementSchemaValues = z.infer<typeof editUserManagementSchema>;
