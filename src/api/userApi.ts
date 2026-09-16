import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define types for requests and responses
export interface User {
  url: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface CreateUserRequest {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface UpdateUserRequest {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface PatchUserRequest {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
}

export interface Permission {
  url: string;
  id: number;
  name: string;
  codename: string;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL }),
  endpoints: (builder) => ({
    getUsers: builder.query<User[], { ordering?: string; search?: string }>({
      query: (params) => ({
        url: "/users/users/",
        params,
      }),
    }),
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (body) => ({
        url: "/users/users/",
        method: "POST",
        body,
      }),
    }),
    getUser: builder.query<User, number>({
      query: (id) => `/users/users/${id}/`,
    }),
    updateUser: builder.mutation<User, { id: number; data: UpdateUserRequest }>(
      {
        query: ({ id, data }) => ({
          url: `/users/users/${id}/`,
          method: "PUT",
          body: data,
        }),
      }
    ),
    patchUser: builder.mutation<User, { id: number; data: PatchUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/users/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/users/${id}/`,
        method: "DELETE",
      }),
    }),
    getPermissions: builder.query<
      Permission[],
      { ordering?: string; search?: string }
    >({
      query: (params) => ({
        url: "/users/permissions/",
        params,
      }),
    }),
    getPermission: builder.query<Permission, number>({
      query: (id) => `/users/permissions/${id}/`,
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useGetUserQuery,
  useUpdateUserMutation,
  usePatchUserMutation,
  useDeleteUserMutation,
  useGetPermissionsQuery,
  useGetPermissionQuery,
} = userApi;
