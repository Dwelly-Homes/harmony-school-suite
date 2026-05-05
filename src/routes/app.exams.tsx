import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/exams")({ component: ExamsPage });

type Exam = { id: string; name: string; term: string|null; class_id: string|null; subject_id: string|null; total_marks: number; exam_date: string|null };

function gradeFor(pct: number) {
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}
const gpaMap: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };

function ExamsPage() {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "teacher";
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<{id:string;name:string}[]>([]);
  const [subjects, setSubjects] = useState<{id:string;name:string;class_id:string|null}[]>([]);
  const [students, setStudents] = useState<{id:string;full_name:string;class_id:string|null}[]>([]);
  const [editing, setEditing] = useState<Partial<Exam>|null>(null);
  const [marksExam, setMarksExam] = useState<Exam|null>(null);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [reportStudent, setReportStudent] = useState<string>("");
  const [report, setReport] = useState<{ exam: string; subject: string; marks: number; total: number; grade: string }[]>([]);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [e, c, s, st] = await Promise.all([
      supabase.from("exams").select("*").order("created_at", { ascending: false }),
      supabase.from("classes").select("id,name"),
      supabase.from("subjects").select("id,name,class_id"),
      supabase.from("students").select("id,full_name,class_id"),
    ]);
    setExams((e.data as Exam[]) ?? []); setClasses(c.data ?? []); setSubjects(s.data ?? []); setStudents(st.data ?? []);
  };

  const cn = (id: string|null) => classes.find(c=>c.id===id)?.name ?? "—";
  const sn = (id: string|null) => subjects.find(s=>s.id===id)?.name ?? "—";

  const saveExam = async () => {
    if (!editing?.name) return toast.error("Name required");
    const payload = { name: editing.name, term: editing.term ?? "Term 1", class_id: editing.class_id ?? null, subject_id: editing.subject_id ?? null, total_marks: editing.total_marks ?? 100, exam_date: editing.exam_date ?? null };
    const op = editing.id ? supabase.from("exams").update(payload).eq("id", editing.id) : supabase.from("exams").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    setEditing(null); load();
  };

  const openMarks = async (e: Exam) => {
    setMarksExam(e);
    const { data } = await supabase.from("grades").select("student_id,marks").eq("exam_id", e.id);
    const m: Record<string, number> = {}; data?.forEach(r=>{ m[r.student_id] = Number(r.marks); }); setMarks(m);
  };
  const saveMarks = async () => {
    if (!marksExam) return;
    const cls = students.filter(s => s.class_id === marksExam.class_id);
    const rows = cls.map(s => {
      const mk = marks[s.id] ?? 0;
      return { exam_id: marksExam.id, student_id: s.id, marks: mk, grade: gradeFor((mk / marksExam.total_marks) * 100) };
    });
    const { error } = await supabase.from("grades").upsert(rows, { onConflict: "exam_id,student_id" });
    if (error) return toast.error(error.message);
    toast.success("Marks saved"); setMarksExam(null);
  };

  useEffect(() => { if (reportStudent) buildReport(); }, [reportStudent]);
  const buildReport = async () => {
    const { data } = await supabase.from("grades").select("marks,grade,exam_id").eq("student_id", reportStudent);
    const out: typeof report = [];
    for (const g of data ?? []) {
      const ex = exams.find(e => e.id === g.exam_id);
      if (!ex) continue;
      out.push({ exam: ex.name, subject: sn(ex.subject_id), marks: Number(g.marks), total: ex.total_marks, grade: g.grade ?? "—" });
    }
    setReport(out);
  };
  const gpa = report.length ? (report.reduce((a, r) => a + (gpaMap[r.grade] ?? 0), 0) / report.length).toFixed(2) : "—";

  const examStudents = marksExam ? students.filter(s => s.class_id === marksExam.class_id) : [];

  return (
    <div>
      <PageHeader title="Examinations & Grades" description="Create exams, enter marks, and generate report cards." />

      <Tabs defaultValue="exams">
        <TabsList><TabsTrigger value="exams">Exams</TabsTrigger><TabsTrigger value="report">Report Card</TabsTrigger></TabsList>

        <TabsContent value="exams" className="mt-4">
          {canEdit && <Dialog open={!!editing} onOpenChange={o=>!o && setEditing(null)}>
            <DialogTrigger asChild><Button className="mb-3"><Plus className="h-4 w-4 mr-1"/>New exam</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing?.id?"Edit":"New"} Exam</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={editing?.name??""} onChange={e=>setEditing({...editing, name: e.target.value})} /></div>
                <div><Label>Term</Label><Input value={editing?.term??""} onChange={e=>setEditing({...editing, term: e.target.value})} placeholder="Term 1" /></div>
                <div><Label>Total marks</Label><Input type="number" value={editing?.total_marks??100} onChange={e=>setEditing({...editing, total_marks: Number(e.target.value)})} /></div>
                <div><Label>Class</Label><Select value={editing?.class_id??""} onValueChange={v=>setEditing({...editing, class_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Class"/></SelectTrigger>
                  <SelectContent>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select></div>
                <div><Label>Subject</Label><Select value={editing?.subject_id??""} onValueChange={v=>setEditing({...editing, subject_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Subject"/></SelectTrigger>
                  <SelectContent>{subjects.filter(s=>!editing?.class_id || s.class_id===editing.class_id).map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select></div>
                <div className="col-span-2"><Label>Date</Label><Input type="date" value={editing?.exam_date??""} onChange={e=>setEditing({...editing, exam_date: e.target.value})} /></div>
              </div>
              <DialogFooter><Button onClick={saveExam}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>}

          <Card>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-3">Exam</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Term</th><th className="p-3">Total</th><th className="p-3"></th></tr></thead>
              <tbody>
                {exams.map(e => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3 font-medium">{e.name}</td><td className="p-3">{cn(e.class_id)}</td><td className="p-3">{sn(e.subject_id)}</td><td className="p-3">{e.term}</td><td className="p-3">{e.total_marks}</td>
                    <td className="p-3 text-right">{canEdit && <Button size="sm" variant="outline" onClick={()=>openMarks(e)}>Enter marks</Button>}</td>
                  </tr>
                ))}
                {exams.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No exams yet.</td></tr>}
              </tbody>
            </table>
          </Card>

          <Dialog open={!!marksExam} onOpenChange={o=>!o && setMarksExam(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Marks — {marksExam?.name}</DialogTitle></DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {examStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-3 border rounded-md p-2">
                    <span className="text-sm">{s.full_name}</span>
                    <Input type="number" min={0} max={marksExam?.total_marks} className="w-24" value={marks[s.id] ?? ""} onChange={e=>setMarks({...marks, [s.id]: Number(e.target.value)})} />
                  </div>
                ))}
              </div>
              <DialogFooter><Button onClick={saveMarks}><Save className="h-4 w-4 mr-1"/>Save marks</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Student Report Card</CardTitle></CardHeader>
            <CardContent>
              <Select value={reportStudent} onValueChange={setReportStudent}>
                <SelectTrigger className="w-72 mb-4"><SelectValue placeholder="Select student"/></SelectTrigger>
                <SelectContent>{students.map(s=><SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
              {reportStudent && (
                <>
                  <table className="w-full text-sm border">
                    <thead className="bg-muted/50"><tr><th className="p-2 text-left border">Exam</th><th className="p-2 text-left border">Subject</th><th className="p-2 border">Marks</th><th className="p-2 border">Total</th><th className="p-2 border">Grade</th></tr></thead>
                    <tbody>{report.map((r,i)=>(<tr key={i}><td className="p-2 border">{r.exam}</td><td className="p-2 border">{r.subject}</td><td className="p-2 border text-center">{r.marks}</td><td className="p-2 border text-center">{r.total}</td><td className="p-2 border text-center font-semibold">{r.grade}</td></tr>))}
                    {report.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No grades recorded.</td></tr>}</tbody>
                  </table>
                  <div className="mt-4 text-right text-lg">GPA: <span className="font-bold">{gpa}</span></div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
