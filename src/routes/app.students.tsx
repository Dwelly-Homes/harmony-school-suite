import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/students")({ component: StudentsPage });

type Student = {
  id: string; full_name: string; dob: string | null; gender: "male"|"female"|"other"|null;
  class_id: string | null; parent_name: string | null; parent_contact: string | null;
  parent_email: string | null; status: string; photo_url: string | null;
};

const PAGE_SIZE = 8;

function StudentsPage() {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "teacher";
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Partial<Student> | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    const [s, c] = await Promise.all([
      supabase.from("students").select("*").order("full_name"),
      supabase.from("classes").select("id,name").order("grade"),
    ]);
    setStudents((s.data as Student[]) ?? []);
    setClasses(c.data ?? []);
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) &&
    (classFilter === "all" || s.class_id === classFilter)
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const className = (id: string | null) => classes.find(c => c.id === id)?.name ?? "—";

  const save = async () => {
    if (!editing?.full_name) return toast.error("Name is required");
    const payload = {
      full_name: editing.full_name,
      dob: editing.dob || null,
      gender: editing.gender || null,
      class_id: editing.class_id || null,
      parent_name: editing.parent_name || null,
      parent_contact: editing.parent_contact || null,
      parent_email: editing.parent_email || null,
      status: editing.status || "active",
    };
    const op = editing.id
      ? supabase.from("students").update(payload).eq("id", editing.id)
      : supabase.from("students").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete student?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <div>
      <PageHeader title="Students" description="Manage student records and profiles."
        actions={canEdit && (
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing({ status: "active" })}><Plus className="h-4 w-4 mr-1"/>Add student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Student</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Full name</Label><Input value={editing?.full_name ?? ""} onChange={e=>setEditing({...editing, full_name: e.target.value})} /></div>
                <div><Label>Date of birth</Label><Input type="date" value={editing?.dob ?? ""} onChange={e=>setEditing({...editing, dob: e.target.value})} /></div>
                <div><Label>Gender</Label>
                  <Select value={editing?.gender ?? ""} onValueChange={v=>setEditing({...editing, gender: v as Student["gender"]})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Class</Label>
                  <Select value={editing?.class_id ?? ""} onValueChange={v=>setEditing({...editing, class_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Parent name</Label><Input value={editing?.parent_name ?? ""} onChange={e=>setEditing({...editing, parent_name: e.target.value})} /></div>
                <div><Label>Parent contact</Label><Input value={editing?.parent_contact ?? ""} onChange={e=>setEditing({...editing, parent_contact: e.target.value})} /></div>
                <div className="col-span-2"><Label>Parent email</Label><Input type="email" value={editing?.parent_email ?? ""} onChange={e=>setEditing({...editing, parent_email: e.target.value})} /></div>
              </div>
              <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search students…" value={search} onChange={e=>{setSearch(e.target.value); setPage(1);}} />
          </div>
          <Select value={classFilter} onValueChange={(v)=>{setClassFilter(v); setPage(1);}}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="Filter class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Gender</TableHead><TableHead>Parent</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell>{className(s.class_id)}</TableCell>
                  <TableCell className="capitalize">{s.gender ?? "—"}</TableCell>
                  <TableCell className="text-sm">{s.parent_name ?? "—"}<div className="text-xs text-muted-foreground">{s.parent_contact}</div></TableCell>
                  <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"} className="capitalize">{s.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {canEdit && <>
                      <Button variant="ghost" size="icon" onClick={()=>setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={()=>del(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </>}
                  </TableCell>
                </TableRow>
              ))}
              {pageItems.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No students found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-muted-foreground">Page {page} of {pages} • {filtered.length} total</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
