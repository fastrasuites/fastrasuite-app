import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import type { AppNotification, GetNotificationsParams } from "@/types/notification";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  if (tenantSchemaName) {
    const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
  }
  return process.env.NEXT_PUBLIC_API_URL || `https://${apiDomain}`;
};

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  tagTypes: ["Notification"],
  baseQuery: async (args, api) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");

    let url: string;
    let method = "GET";
    let body: any = undefined;

    if (typeof args === "string") {
      const endpoint = args.startsWith("/") ? args : `/${args}`;
      url = `${baseUrl}${endpoint}`;
    } else {
      method = args.method || "GET";
      const params = new URLSearchParams();
      if (args.params) {
        Object.entries(args.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      const endpoint = args.url.startsWith("/") ? args.url : `/${args.url}`;
      url = `${baseUrl}${endpoint}${queryString ? `?${queryString}` : ""}`;
      body = args.body ? JSON.stringify(args.body) : undefined;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json().catch(() => ({ message: response.statusText })),
          },
        };
      }

      // Handle 204 or empty response
      if (response.status === 204) {
        return { data: null };
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      return {
        error: {
          status: "FETCH_ERROR",
          error: error.message || "Network request failed",
        },
      };
    }
  },
  endpoints: (builder) => ({
    getNotifications: builder.query<AppNotification[], GetNotificationsParams | void>({
      query: (params) => ({
        url: "/notifications/",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Notification" as const, id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    getNotification: builder.query<AppNotification, number | string>({
      query: (id) => `/notifications/${id}/`,
      providesTags: (result, error, id) => [{ type: "Notification", id: String(id) }],
    }),

    markAsRead: builder.mutation<AppNotification, number | string>({
      query: (id) => ({
        url: `/notifications/${id}/read/`,
        method: "POST",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistic update for getNotifications
        const patchResult = dispatch(
          notificationApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const item = draft.find((n) => String(n.id) === String(id));
            if (item) {
              item.is_read = true;
              item.read_at = new Date().toISOString();
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: "Notification", id: String(id) },
        { type: "Notification", id: "LIST" },
      ],
    }),

    markAllAsRead: builder.mutation<any, void>({
      query: () => ({
        url: "/notifications/read-all/",
        method: "POST",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        // Optimistic update for all queries
        const patchResult = dispatch(
          notificationApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            draft.forEach((n) => {
              n.is_read = true;
              n.read_at = new Date().toISOString();
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;
