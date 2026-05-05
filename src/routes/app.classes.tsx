import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getClasses, getSubjects, getTeachers, saveClass, saveSubject } from "@/data/mockData";

export const Route = createFileRoute("/app/classes")({ component: ClassesPage });

type Cls = { id: string; name: string; grade: number; section: string | null; class_teacher_id: string | null };
type Subj = { id: string; name: string; code: string | null; class_id: string | null; teacher_id: string | null };
type Tch = { id: string; full_name: string };

function ClassesPage() {
  const { role } = useAuth();
  const canEdit = role === "admin";
  const [classes, setClasses] = useState<Cls[]>([]);
  const [subjects, setSubjects] = useState<Subj[]>([]);
  const [teachers, setTeachers] = useState<Tch[]>([]);
  const [editClass, setEditClass] = useState<Partial<Cls> | null>(null);
  const [editSub, setEditSub] = useState<Partial<Subj> | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    setClasses(getClasses() as Cls[]);
    setSubjects(getSubjects() as Subj[]);
    setTeachers(getTeachers().map(({ id, full_name }) => ({ id, full_name })));
  };

  const teacherName = (id: string | null) => teachers.find((teacher) => teacher.id === id)?.full_name ?? "-";
  const className = (id: string | null) => classes.find((item) => item.id === id)?.name ?? "-";

  const saveClassForm = () => {
    if (!editClass?.name || !editClass?.grade) return toast.error("Name & grade required");
    saveClass({ id: editClass.id, name: editClass.name, grade: Number(editClass.grade), section: editClass.section ?? null, class_teacher_id: editClass.class_teacher_id ?? null });
    setEditClass(null);
    load();
  };

  const saveSubjectForm = () => {
    if (!editSub?.name) return toast.error("Name required");
    saveSubject({ id: editSub.id, name: editSub.name, code: editSub.code ?? null, class_id: editSub.class_id ?? null, teacher_id: editSub.teacher_id ?? null });
    setEditSub(null);
    load();
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const periods = [1, 2, 3, 4, 5, 6];

  return (
    <div>
      <PageHeader title="Classes & Subjects" description="Organize classes, subjects, and weekly timetable." />

      <Tabs defaultValue="classes">
        <TabsList><TabsTrigger value="classes">Classes</TabsTrigger><TabsTrigger value="subjects">Subjects</TabsTrigger><TabsTrigger value="timetable">Timetable</TabsTrigger></TabsList>

        <TabsContent value="classes" className="mt-4">
          {canEdit && <Dialog open={!!editClass} onOpenChange={(open) => !open && setEditClass(null)}>
            <DialogTrigger asChild><Button className="mb-3" onClick={() => setEditClass({})}><Plus className="h-4 w-4 mr-1" />New class</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editClass?.id ? "Edit" : "New"} Class</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={editClass?.name ?? ""} onChange={(e) => setEditClass({ ...editClass, name: e.target.value })} /></div>
                <div><Label>Grade</Label><Input type="number" min={1} max={12} value={editClass?.grade ?? ""} onChange={(e) => setEditClass({ ...editClass, grade: Number(e.target.value) })} /></div>
                <div><Label>Section</Label><Input value={editClass?.section ?? ""} onChange={(e) => setEditClass({ ...editClass, section: e.target.value })} /></div>
                <div className="col-span-2"><Label>Class teacher</Label>
                  <Select value={editClass?.class_teacher_id ?? ""} onValueChange={(value) => setEditClass({ ...editClass, class_teacher_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Assign" /></SelectTrigger>
                    <SelectContent>{teachers.map((teacher) => <SelectItem key={teacher.id} value={teacher.id}>{teacher.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={saveClassForm}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground">Grade {item.grade}{item.section ? ` - Section ${item.section}` : ""}</div>
                  <div className="text-lg font-semibold mt-1">{item.name}</div>
                  <div className="text-sm mt-2">Class teacher: <span className="font-medium">{teacherName(item.class_teacher_id)}</span></div>
                  <div className="text-xs text-muted-foreground mt-1">{subjects.filter((subject) => subject.class_id === item.id).length} subjects</div>
                  {canEdit && <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditClass(item)}>Edit</Button>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          {canEdit && <Dialog open={!!editSub} onOpenChange={(open) => !open && setEditSub(null)}>
            <DialogTrigger asChild><Button className="mb-3" onClick={() => setEditSub({})}><Plus className="h-4 w-4 mr-1" />New subject</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editSub?.id ? "Edit" : "New"} Subject</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name</Label><Input value={editSub?.name ?? ""} onChange={(e) => setEditSub({ ...editSub, name: e.target.value })} /></div>
                <div><Label>Code</Label><Input value={editSub?.code ?? ""} onChange={(e) => setEditSub({ ...editSub, code: e.target.value })} /></div>
                <div className="col-span-2"><Label>Class</Label>
                  <Select value={editSub?.class_id ?? ""} onValueChange={(value) => setEditSub({ ...editSub, class_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>{classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Teacher</Label>
                  <Select value={editSub?.teacher_id ?? ""} onValueChange={(value) => setEditSub({ ...editSub, teacher_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Teacher" /></SelectTrigger>
                    <SelectContent>{teachers.map((teacher) => <SelectItem key={teacher.id} value={teacher.id}>{teacher.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={saveSubjectForm}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>}

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-3">Subject</th><th className="p-3">Code</th><th className="p-3">Class</th><th className="p-3">Teacher</th></tr></thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="border-t">
                    <td className="p-3 font-medium">{subject.name}</td><td className="p-3">{subject.code}</td><td className="p-3">{className(subject.class_id)}</td><td className="p-3">{teacherName(subject.teacher_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Weekly Timetable (sample)</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead><tr><th className="p-2 border bg-muted/50">Period</th>{days.map((day) => <th key={day} className="p-2 border bg-muted/50">{day}</th>)}</tr></thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period}>
                      <td className="p-2 border font-medium">{period}</td>
                      {days.map((day, index) => {
                        const subject = subjects[(period + index) % Math.max(1, subjects.length)];
                        return <td key={day} className="p-2 border"><div className="font-medium">{subject?.name ?? "-"}</div><div className="text-xs text-muted-foreground">{teacherName(subject?.teacher_id ?? null)}</div></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
