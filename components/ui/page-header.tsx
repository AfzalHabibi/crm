"use client";

import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showAddButton?: boolean;
  addButtonText?: string;
  onAddClick?: () => void;
  onFiltersClick?: () => void;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  showFilters = true,
  showAddButton = true,
  addButtonText = "Add New",
  onAddClick,
  onFiltersClick,
  actions,
  className,
  children,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Title Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Section */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          )}
          
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFiltersClick}
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-3">
          {actions}
          {showAddButton && (
            <Button
              onClick={onAddClick}
              className="whitespace-nowrap"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Additional Content */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;