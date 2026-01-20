import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plus, Loader2, Pencil, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'free_month' | 'percentage_off' | 'free_scans';
  discount_value: number;
  free_scans_bonus: number;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

const DISCOUNT_TYPES = [
  { value: "free_month", label: "Free Month" },
  { value: "percentage_off", label: "Percentage Off" },
  { value: "free_scans", label: "Free Scans Only" },
];

export default function AdminPromoCodes() {
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [deletingCode, setDeletingCode] = useState<PromoCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "free_month" as 'free_month' | 'percentage_off' | 'free_scans',
    discount_value: 100,
    free_scans_bonus: 0,
    valid_until: "",
    max_uses: "",
  });

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes((data as PromoCode[]) || []);
    } catch (err) {
      console.error("Error fetching promo codes:", err);
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "free_month",
      discount_value: 100,
      free_scans_bonus: 0,
      valid_until: "",
      max_uses: "",
    });
    setEditingCode(null);
  };

  const openCreateDialog = () => {
    resetForm();
    // Set default valid_until to 90 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 90);
    setFormData(prev => ({
      ...prev,
      valid_until: defaultDate.toISOString().split('T')[0],
    }));
    setShowDialog(true);
  };

  const openEditDialog = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      free_scans_bonus: code.free_scans_bonus,
      valid_until: code.valid_until ? code.valid_until.split('T')[0] : "",
      max_uses: code.max_uses?.toString() || "",
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      toast.error("Please enter a code");
      return;
    }

    // Validate code format
    const codeRegex = /^[A-Z0-9]{4,20}$/;
    const upperCode = formData.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!codeRegex.test(upperCode)) {
      toast.error("Code must be 4-20 alphanumeric characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        code: upperCode,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        free_scans_bonus: formData.free_scans_bonus,
        valid_until: formData.valid_until || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        created_by: user?.id || null,
      };

      if (editingCode) {
        const { error } = await supabase
          .from("promo_codes")
          .update(payload)
          .eq("id", editingCode.id);

        if (error) throw error;
        toast.success("Promo code updated");
      } else {
        const { error } = await supabase
          .from("promo_codes")
          .insert(payload);

        if (error) throw error;
        toast.success("Promo code created");
      }

      setShowDialog(false);
      resetForm();
      fetchPromoCodes();
    } catch (err: any) {
      console.error("Error saving promo code:", err);
      if (err.code === '23505') {
        toast.error("A promo code with this name already exists");
      } else {
        toast.error("Failed to save promo code");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCode) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", deletingCode.id);

      if (error) throw error;
      toast.success("Promo code deleted");
      setShowDeleteDialog(false);
      setDeletingCode(null);
      fetchPromoCodes();
    } catch (err) {
      console.error("Error deleting promo code:", err);
      toast.error("Failed to delete promo code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (code: PromoCode) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !code.is_active })
        .eq("id", code.id);

      if (error) throw error;
      toast.success(code.is_active ? "Promo code deactivated" : "Promo code activated");
      fetchPromoCodes();
    } catch (err) {
      console.error("Error toggling promo code:", err);
      toast.error("Failed to update promo code");
    }
  };

  const copyCode = async (code: PromoCode) => {
    await navigator.clipboard.writeText(code.code);
    setCopiedId(code.id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Promo Codes</h2>
          <p className="text-muted-foreground">Manage discount codes and promotions</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>

      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Bonus Scans</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((code) => {
                const usagePercent = code.max_uses 
                  ? (code.current_uses / code.max_uses) * 100 
                  : 0;
                const isExpired = code.valid_until && new Date(code.valid_until) < new Date();

                return (
                  <TableRow key={code.id} className={isExpired ? "opacity-50" : ""}>
                    <TableCell className="font-mono font-medium">{code.code}</TableCell>
                    <TableCell>
                      {DISCOUNT_TYPES.find(t => t.value === code.discount_type)?.label}
                    </TableCell>
                    <TableCell>
                      {code.discount_type === 'percentage_off' ? `${code.discount_value}%` : 
                       code.discount_type === 'free_month' ? 'First month free' : '-'}
                    </TableCell>
                    <TableCell>{code.free_scans_bonus || '-'}</TableCell>
                    <TableCell>
                      {code.valid_until 
                        ? format(new Date(code.valid_until), 'MMM d, yyyy')
                        : 'No expiry'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''}
                        </span>
                        {code.max_uses && (
                          <Progress value={usagePercent} className="w-16 h-2" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={code.is_active}
                        onCheckedChange={() => toggleActive(code)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => copyCode(code)}
                        >
                          {copiedId === code.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(code)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingCode(code);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {promoCodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No promo codes yet. Create your first one!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? "Edit Promo Code" : "Create Promo Code"}
            </DialogTitle>
            <DialogDescription>
              {editingCode 
                ? "Update the promo code details below."
                : "Create a new promo code for your users."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="PRODUCTHUNT"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                }))}
                maxLength={20}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">4-20 alphanumeric characters</p>
            </div>

            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: 'free_month' | 'percentage_off' | 'free_scans') => 
                  setFormData(prev => ({ ...prev, discount_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.discount_type === 'percentage_off' && (
              <div className="space-y-2">
                <Label htmlFor="discount_value">Discount Percentage</Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_value}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    discount_value: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="free_scans_bonus">Bonus Scans</Label>
              <Input
                id="free_scans_bonus"
                type="number"
                min="0"
                value={formData.free_scans_bonus}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  free_scans_bonus: parseInt(e.target.value) || 0
                }))}
              />
              <p className="text-xs text-muted-foreground">Extra scans added to user's account</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  valid_until: e.target.value
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_uses">Max Uses (leave blank for unlimited)</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={formData.max_uses}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_uses: e.target.value
                }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingCode ? "Save Changes" : "Create Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promo Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCode?.code}"? This action cannot be undone.
              {deletingCode && deletingCode.current_uses > 0 && (
                <span className="block mt-2 text-amber-500">
                  {deletingCode.current_uses} users have already used this code.
                </span>
              )}
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
    </div>
  );
}
