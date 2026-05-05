import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/teachers")({ component: TeachersPage });

type Teacher = { id: string; full_name: string; email: string | null; phone: string | null; department: string | null; subject: string | null; qualifications: string | null; };

function TeachersPage() {
  const { role } = useAuth();
  const canEdit = role === "admin";
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<Teacher> | null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("teachers").select("*").order("full_name");
    setTeachers((data as Teacher[]) ?? []);
  };

  const departments = Array.from(new Set(teachers.map(t => t.department).filter(Boolean))) as string[];
  const filtered = filter === "all" ? teachers : teachers.filter(t => t.department === filter);

  const save = async () => {
    if (!editing?.full_name) return toast.error("Name required");
    const payload = {
      full_name: editing.full_name, email: editing.email || null, phone: editing.phone || null,
      department: editing.department || null, subject: editing.subject || null, qualifications: editing.qualifications || null,
    };
    const op = editing.id ? supabase.from("teachers").update(payload).eq("id", editing.id) : supabase.from("teachers").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete teacher?")) return;
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <PageHeader title="Teachers" description="Manage teaching staff and assignments."
        actions={canEdit && (
          <Dialog open={!!editing} onOpenChange={(o)=>!o && setEditing(null)}>
            <DialogTrigger asChild><Button onClick={()=>setEditing({})}><Plus className="h-4 w-4 mr-1"/>Add teacher</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Teacher</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Full name</Label><Input value={editing?.full_name ?? ""} onChange={e=>setEditing({...editing, full_name: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={editing?.email ?? ""} onChange={e=>setEditing({...editing, email: e.target.value})} /></div>
                <div><Label>Phone</Label><Input value={editing?.phone ?? ""} onChange={e=>setEditing({...editing, phone: e.target.value})} /></div>
                <div><Label>Department</Label><Input value={editing?.department ?? ""} onChange={e=>setEditing({...editing, department: e.target.value})} /></div>
                <div><Label>Subject</Label><Input value={editing?.subject ?? ""} onChange={e=>setEditing({...editing, subject: e.target.value})} /></div>
                <div className="col-span-2"><Label>Qualifications</Label><Input value={editing?.qualifications ?? ""} onChange={e=>setEditing({...editing, qualifications: e.target.value})} /></div>
              </div>
              <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <Card className="p-4">
        <div className="mb-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Subject</TableHead><TableHead>Contact</TableHead><TableHead>Qualifications</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.full_name}</TableCell>
                  <TableCell>{t.department ?? "—"}</TableCell>
                  <TableCell>{t.subject ?? "—"}</TableCell>
                  <TableCell className="text-sm">{t.email}<div className="text-xs text-muted-foreground">{t.phone}</div></TableCell>
                  <TableCell className="text-sm">{t.qualifications ?? "—"}</TableCell>
                  <TableCell className="text-right">{canEdit && <>
                    <Button variant="ghost" size="icon" onClick={()=>setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={()=>del(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </>}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No teachers found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
