import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Crown } from "lucide-react";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  subscription_tier: 'free' | 'pro' | 'business';
  subscription_status: 'none' | 'trialing' | 'active' | 'canceled' | 'expired';
  trial_ends_at: string | null;
  scan_credits: number;
  total_scans_used: number;
  promo_code_used: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUsers((data as UserProfile[]) || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (user: UserProfile) => {
    if (user.subscription_status === 'active') {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
    }
    if (user.subscription_status === 'trialing') {
      const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
      const isActive = trialEnds && trialEnds > new Date();
      return isActive 
        ? <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Trial</Badge>
        : <Badge variant="secondary">Trial Expired</Badge>;
    }
    if (user.subscription_status === 'canceled') {
      return <Badge variant="destructive">Canceled</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'pro') {
      return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1"><Crown className="h-3 w-3" />Pro</Badge>;
    }
    if (tier === 'business') {
      return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 gap-1"><Crown className="h-3 w-3" />Business</Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
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
          <h2 className="text-2xl font-bold text-foreground">Users</h2>
          <p className="text-muted-foreground">{users.length} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scans Left</TableHead>
                <TableHead>Total Scans</TableHead>
                <TableHead>Promo Code</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email || 'No email'}</TableCell>
                  <TableCell>{getTierBadge(user.subscription_tier)}</TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>{user.scan_credits}</TableCell>
                  <TableCell>{user.total_scans_used}</TableCell>
                  <TableCell>
                    {user.promo_code_used ? (
                      <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                        {user.promo_code_used}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search ? "No users found matching your search" : "No users yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
}
