import api from "..";
import { apiHasPath } from "../openapi-capabilities";

export const USER_MANAGEMENT_QUERY_KEY = "users-management";

export const fetchUserManagementUsersInfinite = async ({
  pageParam = 0,
  limit = 20,
  kw,
  status,
  role,
}: {
  pageParam?: number;
} & FetchUserManagementUsersParams): Promise<UserManagementListResponse> => {
  if (!(await apiHasPath("/api/v1/users-management"))) {
    return {
      rows: [],
      total: 0,
      page: Math.floor(pageParam / limit) + 1,
      per_page: limit,
      has_more: false,
    };
  }

  const normalizedKeyword = kw?.trim();
  const normalizedStatus: UserManagementStatusFilter =
    status === "active"
    || status === "inactive"
    || status === "locked"
    || status === "pending_verification"
      ? status
      : "all";
  const normalizedRole: UserManagementRoleFilter =
    role === "admin" || role === "viewer" || role === "user" ? role : "all";

  const res = await api.get<UserManagementListResponse>("/users-management", {
    params: {
      offset: pageParam,
      limit,
      kw: normalizedKeyword ? normalizedKeyword : undefined,
      status: normalizedStatus && normalizedStatus !== "all" ? normalizedStatus : undefined,
      role: normalizedRole !== "all" ? normalizedRole : undefined,
    },
  });

  return res.data;
};

export const userManagementInfiniteQuery = ({
  limit = 20,
  kw,
  status,
  role,
}: FetchUserManagementUsersParams = {}) => {
  const normalizedKeyword = kw?.trim().toLowerCase() || undefined;
  const normalizedStatus: UserManagementStatusFilter =
    status === "active"
    || status === "inactive"
    || status === "locked"
    || status === "pending_verification"
      ? status
      : "all";
  const normalizedRole: UserManagementRoleFilter =
    role === "admin" || role === "viewer" || role === "user" ? role : "all";

  return {
    queryKey: [USER_MANAGEMENT_QUERY_KEY, "infinite", limit, normalizedKeyword, normalizedStatus, normalizedRole],
    queryFn: ({ pageParam = 0 }: { pageParam?: number }) =>
      fetchUserManagementUsersInfinite({
        pageParam,
        limit,
        kw: normalizedKeyword,
        status: normalizedStatus,
        role: normalizedRole,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: UserManagementListResponse) => {
      if (lastPage.has_more) {
        const currentOffset = lastPage.page > 0 ? (lastPage.page - 1) * lastPage.per_page : 0;
        return currentOffset + lastPage.per_page;
      }

      return undefined;
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  };
};
