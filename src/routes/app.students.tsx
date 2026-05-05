import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { deleteStudent, getClasses, getStudents, saveStudent } from "@/data/mockData";

export const Route = createFileRoute("/app/students")({ component: StudentsPage });

type Student = {
  id: string;
  full_name: string;
  dob: string | null;
  gender: "male" | "female" | "other" | null;
  class_id: string | null;
  parent_name: string | null;
  parent_contact: string | null;
  parent_email: string | null;
  status: string;
  photo_url: string | null;
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

  useEffect(() => {
    load();
  }, []);

  function load() {
    setStudents(getStudents() as Student[]);
    setClasses(getClasses().map(({ id, name }) => ({ id, name })));
  }

  const filtered = students.filter((student) =>
    student.full_name.toLowerCase().includes(search.toLowerCase()) &&
    (classFilter === "all" || student.class_id === classFilter),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const className = (id: string | null) => classes.find((item) => item.id === id)?.name ?? "-";

  const save = () => {
    if (!editing?.full_name) return toast.error("Name is required");
    saveStudent({
      id: editing.id,
      full_name: editing.full_name,
      dob: editing.dob || null,
      gender: editing.gender || null,
      class_id: editing.class_id || null,
      parent_name: editing.parent_name || null,
      parent_contact: editing.parent_contact || null,
      parent_email: editing.parent_email || null,
      status: editing.status || "active",
    });
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const del = (id: string) => {
    if (!confirm("Delete student?")) return;
    deleteStudent(id);
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student records and profiles."
        actions={canEdit && (
          <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing({ status: "active" })}><Plus className="h-4 w-4 mr-1" />Add student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Student</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Full name</Label><Input value={editing?.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
                <div><Label>Date of birth</Label><Input type="date" value={editing?.dob ?? ""} onChange={(e) => setEditing({ ...editing, dob: e.target.value })} /></div>
                <div><Label>Gender</Label>
                  <Select value={editing?.gender ?? ""} onValueChange={(value) => setEditing({ ...editing, gender: value as Student["gender"] })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Class</Label>
                  <Select value={editing?.class_id ?? ""} onValueChange={(value) => setEditing({ ...editing, class_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Parent name</Label><Input value={editing?.parent_name ?? ""} onChange={(e) => setEditing({ ...editing, parent_name: e.target.value })} /></div>
                <div><Label>Parent contact</Label><Input value={editing?.parent_contact ?? ""} onChange={(e) => setEditing({ ...editing, parent_contact: e.target.value })} /></div>
                <div className="col-span-2"><Label>Parent email</Label><Input type="email" value={editing?.parent_email ?? ""} onChange={(e) => setEditing({ ...editing, parent_email: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search students..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={classFilter} onValueChange={(value) => { setClassFilter(value); setPage(1); }}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="Filter class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Gender</TableHead><TableHead>Parent</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{className(student.class_id)}</TableCell>
                  <TableCell className="capitalize">{student.gender ?? "-"}</TableCell>
                  <TableCell className="text-sm">{student.parent_name ?? "-"}<div className="text-xs text-muted-foreground">{student.parent_contact}</div></TableCell>
                  <TableCell><Badge variant={student.status === "active" ? "default" : "secondary"} className="capitalize">{student.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {canEdit && <>
                      <Button variant="ghost" size="icon" onClick={() => setEditing(student)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => del(student.id)}><Trash2 className="h-4 w-4" /></Button>
                    </>}
                  </TableCell>
                </TableRow>
              ))}
              {pageItems.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No students found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-muted-foreground">Page {page} of {pages} - {filtered.length} total</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
