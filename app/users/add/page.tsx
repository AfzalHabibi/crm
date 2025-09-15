"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppDispatch } from "@/hooks/redux";
import { createUser } from "@/store/slices/userSlice";
import PageHeader from "@/components/ui/page-header";
import GenericForm from "@/components/ui/generic-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/admin-layout";

// User creation schema
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "hr", "finance", "sales", "user"]),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  bio: z.string().optional(),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function AddUserPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      status: "active",
    },
  });

  const handleSubmit = async (data: CreateUserData) => {
    setLoading(true);
    try {
      const result = await dispatch(createUser(data)).unwrap();
      
      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      router.push("/users");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/users");
  };

  const formFields = [
    {
      name: "name",
      label: "Full Name",
      type: "text" as const,
      required: true,
      placeholder: "Enter full name",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email" as const,
      required: true,
      placeholder: "Enter email address",
    },
    {
      name: "password",
      label: "Password",
      type: "password" as const,
      required: true,
      placeholder: "Enter password",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "text" as const,
      placeholder: "Enter phone number",
    },
    {
      name: "role",
      label: "Role",
      type: "select" as const,
      required: true,
      options: [
        { value: "admin", label: "Admin" },
        { value: "manager", label: "Manager" },
        { value: "hr", label: "HR" },
        { value: "finance", label: "Finance" },
        { value: "sales", label: "Sales" },
        { value: "user", label: "User" },
      ],
    },
    {
      name: "department",
      label: "Department",
      type: "select" as const,
      options: [
        { value: "Engineering", label: "Engineering" },
        { value: "Sales", label: "Sales" },
        { value: "Marketing", label: "Marketing" },
        { value: "HR", label: "Human Resources" },
        { value: "Finance", label: "Finance" },
        { value: "Operations", label: "Operations" },
      ],
    },
    {
      name: "position",
      label: "Position",
      type: "text" as const,
      placeholder: "Enter position/title",
    },
    {
      name: "status",
      label: "Status",
      type: "select" as const,
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "suspended", label: "Suspended" },
      ],
    },
    {
      name: "bio",
      label: "Bio",
      type: "textarea" as const,
      placeholder: "Enter user bio (optional)",
    },
  ];

  return (
    <AdminLayout>
      {/* Page Header */}
      <PageHeader
        title="Add New User"
        subtitle="Create a new user account with roles and permissions"
        showSearch={false}
        showFilters={false}
        showAddButton={false}
        actions={
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        }
      />

      {/* User Form */}
      <div className="max-w-4xl">
        <GenericForm
          form={form}
          fields={formFields}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          submitText="Create User"
          cancelText="Cancel"
          gridCols={2}
        />
      </div>
  </AdminLayout>
  );
}