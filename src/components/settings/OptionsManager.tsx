import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { UserOption } from "@/hooks/useUserOptions";

interface OptionsManagerProps {
  title: string;
  description: string;
  options: UserOption[];
  loading: boolean;
  onAdd: (label: string) => Promise<UserOption | null>;
  onUpdate: (id: string, updates: Partial<UserOption>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onSetDefault: (id: string) => Promise<boolean>;
  onReorder: (orderedIds: string[]) => Promise<boolean>;
}

export function OptionsManager({
  title,
  description,
  options,
  loading,
  onAdd,
  onUpdate,
  onDelete,
  onSetDefault,
  onReorder,
}: OptionsManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editingOption, setEditingOption] = useState<UserOption | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [deletingOption, setDeletingOption] = useState<UserOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      toast.error("Please enter a label");
      return;
    }

    setIsSubmitting(true);
    const result = await onAdd(newLabel.trim());
    setIsSubmitting(false);

    if (result) {
      toast.success("Option added successfully");
      setNewLabel("");
      setShowAddDialog(false);
    } else {
      toast.error("Failed to add option");
    }
  };

  const handleEdit = async () => {
    if (!editingOption || !editLabel.trim()) return;

    setIsSubmitting(true);
    const result = await onUpdate(editingOption.id, { label: editLabel.trim() });
    setIsSubmitting(false);

    if (result) {
      toast.success("Option updated");
      setShowEditDialog(false);
      setEditingOption(null);
    } else {
      toast.error("Failed to update option");
    }
  };

  const handleDelete = async () => {
    if (!deletingOption) return;

    setIsSubmitting(true);
    const result = await onDelete(deletingOption.id);
    setIsSubmitting(false);

    if (result) {
      toast.success("Option deleted");
      setShowDeleteDialog(false);
      setDeletingOption(null);
    } else {
      toast.error("Failed to delete option");
    }
  };

  const handleToggleVisibility = async (option: UserOption) => {
    const result = await onUpdate(option.id, { is_hidden: !option.is_hidden });
    if (result) {
      toast.success(option.is_hidden ? "Option shown" : "Option hidden");
    }
  };

  const handleSetDefault = async (option: UserOption) => {
    if (option.is_default) {
      // Clear default
      const result = await onUpdate(option.id, { is_default: false });
      if (result) toast.success("Default cleared");
    } else {
      const result = await onSetDefault(option.id);
      if (result) toast.success("Default set");
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newOrder = [...options];
    const draggedIndex = newOrder.findIndex(o => o.id === draggedId);
    const targetIndex = newOrder.findIndex(o => o.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, removed);
      // Update visual order immediately (optimistic)
    }
  };

  const handleDragEnd = async () => {
    if (!draggedId) return;

    const orderedIds = options.map(o => o.id);
    setDraggedId(null);
    await onReorder(orderedIds);
  };

  const openEditDialog = (option: UserOption) => {
    setEditingOption(option);
    setEditLabel(option.label);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (option: UserOption) => {
    setDeletingOption(option);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground/70">{description}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddDialog(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <GlassCard className="divide-y divide-border p-0" hover={false}>
          {options.map((option) => (
            <div
              key={option.id}
              draggable
              onDragStart={() => handleDragStart(option.id)}
              onDragOver={(e) => handleDragOver(e, option.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 transition-colors ${
                option.is_hidden ? "opacity-50" : ""
              } ${draggedId === option.id ? "bg-secondary/50" : ""}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium truncate ${option.is_hidden ? "line-through" : ""}`}>
                    {option.label}
                  </span>
                  {option.is_system && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      Default
                    </span>
                  )}
                  {option.is_default && (
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleSetDefault(option)}
                  title={option.is_default ? "Remove default" : "Set as default"}
                >
                  {option.is_default ? (
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleToggleVisibility(option)}
                  title={option.is_hidden ? "Show" : "Hide"}
                >
                  {option.is_hidden ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>

                {!option.is_system && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(option)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(option)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {options.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No options configured
            </div>
          )}
        </GlassCard>
      </section>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Option</DialogTitle>
            <DialogDescription>
              Create a new option that will appear in your selection lists.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter label..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Option
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Option</DialogTitle>
            <DialogDescription>
              Update the label for this option.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter label..."
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Option</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingOption?.label}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
