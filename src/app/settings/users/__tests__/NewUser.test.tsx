import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewUser from "../newUser/page";
import { useCreateUserMutation } from "@/api/settings/usersApi";
import { useGetCompanyQuery } from "@/api/settings/companyApi";
import { useGetPermissionTemplatesQuery } from "@/api/settings/permissionsTemplateApi";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("@/api/settings/usersApi", () => ({
  useCreateUserMutation: jest.fn(),
}));

jest.mock("@/api/settings/companyApi", () => ({
  useGetCompanyQuery: jest.fn(),
}));

jest.mock("@/api/settings/permissionsTemplateApi", () => ({
  useGetPermissionTemplatesQuery: jest.fn(),
}));

jest.mock("@/components/auth/PageGuard", () => ({
  PageGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Polyfill ResizeObserver for Radix UI components in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("NewUser Page Error Handling & StatusModal", () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };
  const mockCreateUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSelector as jest.Mock).mockImplementation((selector: any) =>
      selector({
        auth: {
          tenant_company_name: "Acme Corp",
          tenant_schema_name: "acme",
        },
      })
    );
    (useGetCompanyQuery as jest.Mock).mockReturnValue({
      data: { roles: [{ id: 1, name: "Manager" }] },
      isLoading: false,
    });
    (useGetPermissionTemplatesQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (useCreateUserMutation as jest.Mock).mockReturnValue([
      mockCreateUser,
      { isLoading: false },
    ]);
  });

  it("displays actual error message in StatusModal when backend returns { error: [{ email: 'This email already exists' }] }", async () => {
    mockCreateUser.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        data: {
          error: [{ email: "This email already exists" }],
        },
      }),
    });

    render(<NewUser />);

    fireEvent.change(screen.getByPlaceholderText("Enter first name"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter last name"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email address"), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter phone number"), {
      target: { value: "08012345678" },
    });

    const saveBtn = screen.getByRole("button", { name: /Save User/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("Failed to Create User")).toBeInTheDocument();
      expect(screen.getAllByText("This email already exists").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows success StatusModal on successful user creation", async () => {
    mockCreateUser.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ id: 10 }),
    });

    render(<NewUser />);

    fireEvent.change(screen.getByPlaceholderText("Enter first name"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter last name"), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email address"), {
      target: { value: "jane.smith@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter phone number"), {
      target: { value: "08098765432" },
    });

    const saveBtn = screen.getByRole("button", { name: /Save User/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("User Created")).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith created successfully/i)).toBeInTheDocument();
    });
  });
});
