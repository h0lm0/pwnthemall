import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";

import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ConfigurationForm from "./ConfigurationForm";
import { Config, ConfigFormData } from "@/models/Config";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { toast } from "sonner";

interface ConfigurationContentProps {
  configs: Config[];
  onRefresh: () => void;
}

export default function ConfigurationContent({ configs, onRefresh }: ConfigurationContentProps) {
  const { t, isLoaded } = useLanguage();
  const { siteConfig, refreshConfig } = useSiteConfig();
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Config | null>(null);
  const [confirmMassDelete, setConfirmMassDelete] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [createError, setCreateError] = useState<string | null>(null);

  const columns: ColumnDef<Config>[] = [
    {
      accessorKey: "key",
      header: t("key"),
      cell: ({ getValue }) => (
        <span className="block min-w-[150px] max-w-[250px] truncate font-mono text-sm">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "value",
      header: t("value"),
      cell: ({ getValue }) => (
        <span className="block min-w-[200px] max-w-[300px] truncate font-mono text-sm">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "public",
      header: t("public"),
      cell: ({ getValue }) => {
        const isPublic = getValue() as boolean;
        return (
          <span className={cn("font-semibold", isPublic ? "text-green-600" : "text-red-600")}>
            {isPublic ? t("yes") : t("no")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => (
        <div className="flex gap-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingConfig(row.original)}
          >
            {t("edit")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleting(row.original)}
          >
            {t("delete")}
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = async (data: ConfigFormData) => {
    setCreateError(null);
    try {
      await axios.post("/api/configs", data);
      setCreating(false);
      toast.success(t("config_created_success"));
      onRefresh();
      // Refresh site config if this is a public config
      if (data.public) {
        refreshConfig();
      }
    } catch (err: any) {
      let msg = err?.response?.data?.error || "Failed to create configuration";
      
      if (!isLoaded) {
        setCreateError("Failed to create configuration.");
        return;
      }
      
      setCreateError(msg);
    }
  };

  const handleUpdate = async (data: ConfigFormData) => {
    if (!editingConfig) return;
    await axios.put(`/api/configs/${editingConfig.key}`, data);
    setEditingConfig(null);
    toast.success(t("config_updated_success"));
    onRefresh();
    // Refresh site config if this is a public config
    if (data.public) {
      refreshConfig();
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const wasPublic = deleting.public;
    await axios.delete(`/api/configs/${deleting.key}`);
    setDeleting(null);
    toast.success(t("config_deleted_success"));
    onRefresh();
    // Refresh site config if this was a public config
    if (wasPublic) {
      refreshConfig();
    }
  };

  const doDeleteSelected = async () => {
    const keys = Object.keys(rowSelection).map((key) => configs[parseInt(key, 10)].key);
    await Promise.all(keys.map((key) => axios.delete(`/api/configs/${key}`)));
    setRowSelection({});
    setConfirmMassDelete(false);
    toast.success(t("configs_deleted_success"));
    onRefresh();
  };

  return (
    <>
      <Head>
        <title>{siteConfig.SITE_NAME || 'pwnthemall'} - admin zone</title>
      </Head>
      <div className="bg-muted min-h-screen p-4 overflow-x-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("configuration")}</h1>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 h-9",
                Object.keys(rowSelection).length === 0 && "invisible"
              )}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmMassDelete(true)}
              >
                {t("delete_selected")}
              </Button>
            </div>
            <Sheet open={creating} onOpenChange={setCreating}>
              <SheetTrigger asChild>
                <Button size="sm">{t("new_config")}</Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <SheetHeader>
                  <SheetTitle>{t("create_config")}</SheetTitle>
                </SheetHeader>
                <ConfigurationForm onSubmit={handleCreate} apiError={createError} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={configs}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editingConfig} onOpenChange={(o) => !o && setEditingConfig(null)}>
        <SheetContent side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle>{t("edit_config")}</SheetTitle>
          </SheetHeader>
          {editingConfig && (
            <ConfigurationForm
              isEdit
              initialData={{
                key: editingConfig.key,
                value: editingConfig.value,
                public: editingConfig.public,
              }}
              onSubmit={handleUpdate}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_config")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_config_confirm", { key: deleting?.key || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Mass Delete */}
      <AlertDialog open={confirmMassDelete} onOpenChange={setConfirmMassDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_configs")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_configs_confirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={doDeleteSelected}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 