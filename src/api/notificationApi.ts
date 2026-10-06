import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AppNotification,
  GetNotificationsParams,
} from "@/types/notification";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  tagTypes: ["Notification"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getNotifications: builder.query<
      AppNotification[],
      GetNotificationsParams | void
    >({
      query: (params) => ({
        url: "/notifications/",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Notification" as const,
                id,
              })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    getNotification: builder.query<AppNotification, number | string>({
      query: (id) => `/notifications/${id}/`,
      providesTags: (result, error, id) => [
        { type: "Notification", id: String(id) },
      ],
    }),

    markAsRead: builder.mutation<AppNotification, number | string>({
      query: (id) => ({
        url: `/notifications/${id}/read/`,
        method: "POST",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistic update for getNotifications
        const patchResult = dispatch(
          notificationApi.util.updateQueryData(
            "getNotifications",
            undefined,
            (draft) => {
              const item = draft.find((n) => String(n.id) === String(id));
              if (item) {
                item.is_read = true;
                item.read_at = new Date().toISOString();
              }
            },
          ),
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
          notificationApi.util.updateQueryData(
            "getNotifications",
            undefined,
            (draft) => {
              draft.forEach((n) => {
                n.is_read = true;
                n.read_at = new Date().toISOString();
              });
            },
          ),
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
