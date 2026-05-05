import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export const Route = createFileRoute("/app/classes")({ component: ClassesPage });

type Cls = { id: string; name: string; grade: number; section: string|null; class_teacher_id: string|null };
type Subj = { id: string; name: string; code: string|null; class_id: string|null; teacher_id: string|null };
type Tch = { id: string; full_name: string };

function ClassesPage() {
  const { role } = useAuth();
  const canEdit = role === "admin";
  const [classes, setClasses] = useState<Cls[]>([]);
  const [subjects, setSubjects] = useState<Subj[]>([]);
  const [teachers, setTeachers] = useState<Tch[]>([]);
  const [editClass, setEditClass] = useState<Partial<Cls>|null>(null);
  const [editSub, setEditSub] = useState<Partial<Subj>|null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [c, s, t] = await Promise.all([
      supabase.from("classes").select("*").order("grade"),
      supabase.from("subjects").select("*").order("name"),
      supabase.from("teachers").select("id,full_name"),
    ]);
    setClasses(c.data ?? []); setSubjects(s.data ?? []); setTeachers(t.data ?? []);
  };

  const tName = (id: string|null) => teachers.find(t=>t.id===id)?.full_name ?? "—";
  const cName = (id: string|null) => classes.find(c=>c.id===id)?.name ?? "—";

  const saveClass = async () => {
    if (!editClass?.name || !editClass?.grade) return toast.error("Name & grade required");
    const payload = { name: editClass.name, grade: Number(editClass.grade), section: editClass.section ?? null, class_teacher_id: editClass.class_teacher_id ?? null };
    const op = editClass.id ? supabase.from("classes").update(payload).eq("id", editClass.id) : supabase.from("classes").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    setEditClass(null); load();
  };

  const saveSub = async () => {
    if (!editSub?.name) return toast.error("Name required");
    const payload = { name: editSub.name, code: editSub.code ?? null, class_id: editSub.class_id ?? null, teacher_id: editSub.teacher_id ?? null };
    const op = editSub.id ? supabase.from("subjects").update(payload).eq("id", editSub.id) : supabase.from("subjects").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    setEditSub(null); load();
  };

  const days = ["Mon","Tue","Wed","Thu","Fri"];
  const periods = [1,2,3,4,5,6];

  return (
    <div>
      <PageHeader title="Classes & Subjects" description="Organize classes, subjects, and weekly timetable." />

      <Tabs defaultValue="classes">
        <TabsList><TabsTrigger value="classes">Classes</TabsTrigger><TabsTrigger value="subjects">Subjects</TabsTrigger><TabsTrigger value="timetable">Timetable</TabsTrigger></TabsList>

        <TabsContent value="classes" className="mt-4">
          {canEdit && <Dialog open={!!editClass} onOpenChange={o=>!o && setEditClass(null)}>
            <DialogTrigger asChild><Button className="mb-3"><Plus className="h-4 w-4 mr-1"/>New class</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editClass?.id?"Edit":"New"} Class</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={editClass?.name??""} onChange={e=>setEditClass({...editClass, name: e.target.value})} /></div>
                <div><Label>Grade</Label><Input type="number" min={1} max={12} value={editClass?.grade??""} onChange={e=>setEditClass({...editClass, grade: Number(e.target.value)})} /></div>
                <div><Label>Section</Label><Input value={editClass?.section??""} onChange={e=>setEditClass({...editClass, section: e.target.value})} /></div>
                <div className="col-span-2"><Label>Class teacher</Label>
                  <Select value={editClass?.class_teacher_id ?? ""} onValueChange={v=>setEditClass({...editClass, class_teacher_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Assign" /></SelectTrigger>
                    <SelectContent>{teachers.map(t=><SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={saveClass}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(c => (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground">Grade {c.grade}{c.section?` • Section ${c.section}`:""}</div>
                  <div className="text-lg font-semibold mt-1">{c.name}</div>
                  <div className="text-sm mt-2">Class teacher: <span className="font-medium">{tName(c.class_teacher_id)}</span></div>
                  <div className="text-xs text-muted-foreground mt-1">{subjects.filter(s=>s.class_id===c.id).length} subjects</div>
                  {canEdit && <Button variant="outline" size="sm" className="mt-3" onClick={()=>setEditClass(c)}>Edit</Button>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          {canEdit && <Dialog open={!!editSub} onOpenChange={o=>!o && setEditSub(null)}>
            <DialogTrigger asChild><Button className="mb-3"><Plus className="h-4 w-4 mr-1"/>New subject</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editSub?.id?"Edit":"New"} Subject</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name</Label><Input value={editSub?.name??""} onChange={e=>setEditSub({...editSub, name: e.target.value})} /></div>
                <div><Label>Code</Label><Input value={editSub?.code??""} onChange={e=>setEditSub({...editSub, code: e.target.value})} /></div>
                <div className="col-span-2"><Label>Class</Label>
                  <Select value={editSub?.class_id??""} onValueChange={v=>setEditSub({...editSub, class_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Class"/></SelectTrigger>
                    <SelectContent>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Teacher</Label>
                  <Select value={editSub?.teacher_id??""} onValueChange={v=>setEditSub({...editSub, teacher_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Teacher"/></SelectTrigger>
                    <SelectContent>{teachers.map(t=><SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={saveSub}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>}

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-3">Subject</th><th className="p-3">Code</th><th className="p-3">Class</th><th className="p-3">Teacher</th></tr></thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3 font-medium">{s.name}</td><td className="p-3">{s.code}</td><td className="p-3">{cName(s.class_id)}</td><td className="p-3">{tName(s.teacher_id)}</td>
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
                <thead><tr><th className="p-2 border bg-muted/50">Period</th>{days.map(d=><th key={d} className="p-2 border bg-muted/50">{d}</th>)}</tr></thead>
                <tbody>
                  {periods.map(p => (
                    <tr key={p}>
                      <td className="p-2 border font-medium">{p}</td>
                      {days.map((d,di) => {
                        const s = subjects[(p+di) % Math.max(1, subjects.length)];
                        return <td key={d} className="p-2 border"><div className="font-medium">{s?.name ?? "—"}</div><div className="text-xs text-muted-foreground">{tName(s?.teacher_id ?? null)}</div></td>;
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
