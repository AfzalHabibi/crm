"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { InlineLoader } from "./loader";
import { cn } from "@/lib/utils";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "switch" | "date";
  placeholder?: string;
  description?: string;
  options?: { label: string; value: string | number }[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number; // for textarea
}

export interface GenericFormProps {
  form: UseFormReturn<any>;
  fields: FormFieldConfig[];
  onSubmit: (data: any) => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  className?: string;
  gridCols?: 1 | 2 | 3;
  showCancel?: boolean;
}

const GenericForm: React.FC<GenericFormProps> = ({
  form,
  fields,
  onSubmit,
  loading = false,
  submitText = "Submit",
  cancelText = "Cancel",
  onCancel,
  className,
  gridCols = 1,
  showCancel = true,
}) => {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  const renderField = (field: FormFieldConfig) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem className={field.className}>
            <FormLabel className={field.required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
              {field.label}
            </FormLabel>
            <FormControl>
              {(() => {
                switch (field.type) {
                  case "textarea":
                    return (
                      <Textarea
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        rows={field.rows || 3}
                        {...formField}
                      />
                    );

                  case "select":
                    return (
                      <Select
                        onValueChange={formField.onChange}
                        defaultValue={formField.value}
                        disabled={field.disabled || loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Select an option"} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );

                  case "checkbox":
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                          disabled={field.disabled || loading}
                        />
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {field.description || field.label}
                        </label>
                      </div>
                    );

                  case "switch":
                    return (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                          disabled={field.disabled || loading}
                        />
                        <label className="text-sm font-medium">
                          {field.description || field.label}
                        </label>
                      </div>
                    );

                  case "date":
                    return (
                      <Input
                        type="date"
                        disabled={field.disabled || loading}
                        {...formField}
                      />
                    );

                  default:
                    return (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        {...formField}
                      />
                    );
                }
              })()}
            </FormControl>
            {field.description && field.type !== "checkbox" && field.type !== "switch" && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
        <div className={cn("grid gap-6", gridClasses[gridCols])}>
          {fields.map(renderField)}
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          {showCancel && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <InlineLoader className="mr-2" />}
            {submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default GenericForm;