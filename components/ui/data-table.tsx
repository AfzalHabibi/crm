"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableLoader } from "./loader";

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface ActionMenuItem<T> {
  label: string;
  icon: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
  disabled?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (column: keyof T, direction: "asc" | "desc") => void;
  sortColumn?: keyof T;
  sortDirection?: "asc" | "desc";
  showViewToggle?: boolean;
  defaultView?: "table" | "grid";
  onViewChange?: (view: "table" | "grid") => void;
  actions?: ActionMenuItem<T>[];
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
  gridRenderItem?: (item: T, index: number) => React.ReactNode;
  showQuickView?: boolean;
  onQuickView?: (row: T) => void;
}

const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  totalCount = 0,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  onSort,
  sortColumn,
  sortDirection,
  showViewToggle = true,
  defaultView = "table",
  onViewChange,
  actions = [],
  onRowClick,
  className,
  emptyMessage = "No data available",
  gridRenderItem,
  showQuickView = true,
  onQuickView,
}: DataTableProps<T>) => {
  const [currentView, setCurrentView] = useState<"table" | "grid">(defaultView);

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const handleViewChange = (view: "table" | "grid") => {
    setCurrentView(view);
    onViewChange?.(view);
  };

  const handleSort = (column: keyof T) => {
    if (!onSort) return;
    
    const newDirection = 
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
    onSort(column, newDirection);
  };

  const renderSortIcon = (column: keyof T) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4 ml-2" /> : 
      <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const defaultActions = useMemo(() => {
    const baseActions: ActionMenuItem<T>[] = [];
    
    if (showQuickView && onQuickView) {
      baseActions.push({
        label: "Quick View",
        icon: <Eye className="h-4 w-4" />,
        onClick: onQuickView,
      });
    }
    
    return [...baseActions, ...actions];
  }, [actions, showQuickView, onQuickView]);

  // Default grid item renderer
  const defaultGridItem = (item: T, index: number) => (
    <Card 
      key={index} 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onRowClick?.(item)}
    >
      <div className="space-y-2">
        {columns.slice(0, 3).map((column) => (
          <div key={String(column.key)} className="flex justify-between">
            <span className="text-sm text-muted-foreground">{column.label}:</span>
            <span className="text-sm font-medium">
              {column.render ? column.render(item[column.key], item) : String(item[column.key])}
            </span>
          </div>
        ))}
        {defaultActions.length > 0 && (
          <div className="flex justify-end pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {defaultActions.map((action, actionIndex) => (
                  <DropdownMenuItem
                    key={actionIndex}
                    onClick={() => action.onClick(item)}
                    disabled={action.disabled?.(item)}
                    className={action.variant === "destructive" ? "text-destructive" : ""}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {showViewToggle && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 p-1 bg-muted rounded-md">
              <div className="h-8 w-8 bg-muted-foreground/20 rounded animate-pulse" />
              <div className="h-8 w-8 bg-muted-foreground/20 rounded animate-pulse" />
            </div>
          </div>
        )}
        <TableLoader rows={pageSize} columns={columns.length} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Toggle */}
      {showViewToggle && (
        <div className="flex justify-end">
          <div className="flex items-center gap-2 p-1 bg-muted rounded-md">
            <Button
              variant={currentView === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("table")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={currentView === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : currentView === "table" ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={cn(column.className)}
                    style={{ width: column.width }}
                  >
                    {column.sortable ? (
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label}
                        {renderSortIcon(column.key)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
                {defaultActions.length > 0 && (
                  <TableHead className="w-[50px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className={cn(column.className)}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key])
                      }
                    </TableCell>
                  ))}
                  {defaultActions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {defaultActions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              disabled={action.disabled?.(row)}
                              className={action.variant === "destructive" ? "text-destructive" : ""}
                            >
                              {action.icon}
                              <span className="ml-2">{action.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, index) => 
            gridRenderItem ? gridRenderItem(item, index) : defaultGridItem(item, index)
          )}
        </div>
      )}

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {totalCount} entries
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className="h-8 px-2 bg-background border border-border rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm px-3">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;