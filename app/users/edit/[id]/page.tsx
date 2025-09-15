"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppDispatch } from "@/hooks/redux";
import { updateUser, fetchUserById } from "@/store/slices/userSlice";
import PageHeader from "@/components/ui/page-header";
import GenericForm from "@/components/ui/generic-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import Loader from "@/components/ui/loader";

// User update schema
const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "hr", "finance", "sales", "user"]),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]),
  bio: z.string().optional(),
  // Address fields
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  // Emergency Contact
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  // Preferences
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().default("en"),
  timezone: z.string().default("UTC"),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
});

type UpdateUserData = z.infer<typeof updateUserSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      status: "active",
      theme: "system",
      language: "en",
      timezone: "UTC",
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
    },
  });

  useEffect(() => {
    if (params.id) {
      fetchUser(params.id as string);
    }
  }, [params.id]);

  const fetchUser = async (userId: string) => {
    try {
      setLoading(true);
      const result = await dispatch(fetchUserById(userId)).unwrap();
      
      if (result.success && result.data) {
        const user = result.data;
        
        // Map user data to form format
        form.reset({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role as any,
          department: user.department || "",
          position: user.position || "",
          status: user.status as any,
          bio: user.metadata?.notes || "",
          // Address fields
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          country: user.address?.country || "",
          zipCode: user.address?.zipCode || "",
          // Emergency Contact (if available)
          emergencyName: "",
          emergencyPhone: "",
          emergencyRelationship: "",
          // Preferences
          theme: user.preferences?.theme || "system",
          language: user.preferences?.language || "en",
          timezone: user.preferences?.timezone || "UTC",
          emailNotifications: user.preferences?.notifications?.email ?? true,
          smsNotifications: user.preferences?.notifications?.sms ?? false,
          pushNotifications: user.preferences?.notifications?.push ?? true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to load user",
        variant: "destructive",
      });
      router.push("/users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateUserData) => {
    if (!params.id) return;
    
    setSaving(true);
    try {
      // Transform form data to API format
      const updateData = {
        _id: params.id as string,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: data.department,
        position: data.position,
        status: data.status,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          country: data.country,
          zipCode: data.zipCode,
        },
        preferences: {
          theme: data.theme,
          language: data.language,
          timezone: data.timezone,
          notifications: {
            email: data.emailNotifications,
            sms: data.smsNotifications,
            push: data.pushNotifications,
          },
        },
        metadata: {
          notes: data.bio,
        },
      };
      
      await dispatch(updateUser(updateData)).unwrap();
      
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      router.push("/users");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/users");
  };

  const formFields = [
    // Basic Information Section
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
        { value: "", label: "Select Department" },
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
      label: "Bio/Notes",
      type: "textarea" as const,
      placeholder: "Enter user bio or notes (optional)",
      rows: 3,
    },
    // Address Information
    {
      name: "street",
      label: "Street Address",
      type: "text" as const,
      placeholder: "Enter street address",
    },
    {
      name: "city",
      label: "City",
      type: "text" as const,
      placeholder: "Enter city",
    },
    {
      name: "state",
      label: "State/Province",
      type: "text" as const,
      placeholder: "Enter state or province",
    },
    {
      name: "country",
      label: "Country",
      type: "text" as const,
      placeholder: "Enter country",
    },
    {
      name: "zipCode",
      label: "ZIP/Postal Code",
      type: "text" as const,
      placeholder: "Enter ZIP or postal code",
    },
    // Emergency Contact
    {
      name: "emergencyName",
      label: "Emergency Contact Name",
      type: "text" as const,
      placeholder: "Enter emergency contact name",
    },
    {
      name: "emergencyPhone",
      label: "Emergency Contact Phone",
      type: "text" as const,
      placeholder: "Enter emergency contact phone",
    },
    {
      name: "emergencyRelationship",
      label: "Relationship",
      type: "text" as const,
      placeholder: "Enter relationship (e.g., Spouse, Parent)",
    },
    // Preferences
    {
      name: "theme",
      label: "Theme Preference",
      type: "select" as const,
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
      ],
    },
    {
      name: "language",
      label: "Language",
      type: "select" as const,
      options: [
        { value: "en", label: "English" },
        { value: "es", label: "Spanish" },
        { value: "fr", label: "French" },
        { value: "de", label: "German" },
      ],
    },
    {
      name: "timezone",
      label: "Timezone",
      type: "select" as const,
      options: [
        { value: "UTC", label: "UTC" },
        { value: "America/New_York", label: "Eastern Time" },
        { value: "America/Chicago", label: "Central Time" },
        { value: "America/Denver", label: "Mountain Time" },
        { value: "America/Los_Angeles", label: "Pacific Time" },
      ],
    },
    // Notification Preferences
    {
      name: "emailNotifications",
      label: "Email Notifications",
      type: "switch" as const,
      description: "Receive notifications via email",
    },
    {
      name: "smsNotifications",
      label: "SMS Notifications",
      type: "switch" as const,
      description: "Receive notifications via SMS",
    },
    {
      name: "pushNotifications",
      label: "Push Notifications",
      type: "switch" as const,
      description: "Receive push notifications in browser",
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader 
            title="Edit User"
            subtitle="Loading user data..."
            showSearch={false}
            showFilters={false}
            showAddButton={false}
          />
          <Loader fullScreen={false} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <PageHeader
        title="Edit User"
        subtitle="Update user information, roles, and preferences"
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
      <div className="max-w-6xl">
        <GenericForm
          form={form}
          fields={formFields}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
          submitText="Update User"
          cancelText="Cancel"
          gridCols={3}
        />
      </div>
    </AdminLayout>
  );
}