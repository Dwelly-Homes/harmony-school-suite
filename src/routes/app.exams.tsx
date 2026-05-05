import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { getClasses, getExams, getGradesForExam, getGradesForStudent, getStudents, getSubjects, saveExam, saveGradesForExam } from "@/data/mockData";

export const Route = createFileRoute("/app/exams")({ component: ExamsPage });

type Exam = { id: string; name: string; term: string | null; class_id: string | null; subject_id: string | null; total_marks: number; exam_date: string | null };

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
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; class_id: string | null }[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string; class_id: string | null }[]>([]);
  const [editing, setEditing] = useState<Partial<Exam> | null>(null);
  const [marksExam, setMarksExam] = useState<Exam | null>(null);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [reportStudent, setReportStudent] = useState<string>("");
  const [report, setReport] = useState<{ exam: string; subject: string; marks: number; total: number; grade: string }[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    setExams(getExams() as Exam[]);
    setClasses(getClasses().map(({ id, name }) => ({ id, name })));
    setSubjects(getSubjects().map(({ id, name, class_id }) => ({ id, name, class_id })));
    setStudents(getStudents().map(({ id, full_name, class_id }) => ({ id, full_name, class_id })));
  };

  const className = (id: string | null) => classes.find((item) => item.id === id)?.name ?? "-";
  const subjectName = (id: string | null) => subjects.find((item) => item.id === id)?.name ?? "-";

  const saveExamForm = () => {
    if (!editing?.name) return toast.error("Name required");
    saveExam({ id: editing.id, name: editing.name, term: editing.term ?? "Term 1", class_id: editing.class_id ?? null, subject_id: editing.subject_id ?? null, total_marks: editing.total_marks ?? 100, exam_date: editing.exam_date ?? null });
    setEditing(null);
    load();
  };

  const openMarks = (exam: Exam) => {
    setMarksExam(exam);
    const nextMarks: Record<string, number> = {};
    getGradesForExam(exam.id).forEach((row) => {
      nextMarks[row.student_id] = Number(row.marks);
    });
    setMarks(nextMarks);
  };

  const saveMarks = () => {
    if (!marksExam) return;
    const classStudents = students.filter((student) => student.class_id === marksExam.class_id);
    const rows = classStudents.map((student) => {
      const score = marks[student.id] ?? 0;
      return { student_id: student.id, marks: score, grade: gradeFor((score / marksExam.total_marks) * 100) };
    });
    saveGradesForExam(marksExam.id, rows);
    toast.success("Marks saved");
    setMarksExam(null);
  };

  useEffect(() => {
    if (reportStudent) buildReport();
  }, [reportStudent, exams]);

  const buildReport = () => {
    const nextReport: typeof report = [];
    for (const grade of getGradesForStudent(reportStudent)) {
      const exam = exams.find((item) => item.id === grade.exam_id);
      if (!exam) continue;
      nextReport.push({ exam: exam.name, subject: subjectName(exam.subject_id), marks: Number(grade.marks), total: exam.total_marks, grade: grade.grade ?? "-" });
    }
    setReport(nextReport);
  };

  const gpa = report.length ? (report.reduce((sum, row) => sum + (gpaMap[row.grade] ?? 0), 0) / report.length).toFixed(2) : "-";
  const examStudents = marksExam ? students.filter((student) => student.class_id === marksExam.class_id) : [];

  return (
    <div>
      <PageHeader title="Examinations & Grades" description="Create exams, enter marks, and generate report cards." />

      <Tabs defaultValue="exams">
        <TabsList><TabsTrigger value="exams">Exams</TabsTrigger><TabsTrigger value="report">Report Card</TabsTrigger></TabsList>

        <TabsContent value="exams" className="mt-4">
          {canEdit && <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
            <DialogTrigger asChild><Button className="mb-3" onClick={() => setEditing({})}><Plus className="h-4 w-4 mr-1" />New exam</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Exam</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Term</Label><Input value={editing?.term ?? ""} onChange={(e) => setEditing({ ...editing, term: e.target.value })} placeholder="Term 1" /></div>
                <div><Label>Total marks</Label><Input type="number" value={editing?.total_marks ?? 100} onChange={(e) => setEditing({ ...editing, total_marks: Number(e.target.value) })} /></div>
                <div><Label>Class</Label><Select value={editing?.class_id ?? ""} onValueChange={(value) => setEditing({ ...editing, class_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select></div>
                <div><Label>Subject</Label><Select value={editing?.subject_id ?? ""} onValueChange={(value) => setEditing({ ...editing, subject_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>{subjects.filter((subject) => !editing?.class_id || subject.class_id === editing.class_id).map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}</SelectContent>
                </Select></div>
                <div className="col-span-2"><Label>Date</Label><Input type="date" value={editing?.exam_date ?? ""} onChange={(e) => setEditing({ ...editing, exam_date: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={saveExamForm}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>}

          <Card>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-3">Exam</th><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Term</th><th className="p-3">Total</th><th className="p-3"></th></tr></thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-t">
                    <td className="p-3 font-medium">{exam.name}</td><td className="p-3">{className(exam.class_id)}</td><td className="p-3">{subjectName(exam.subject_id)}</td><td className="p-3">{exam.term}</td><td className="p-3">{exam.total_marks}</td>
                    <td className="p-3 text-right">{canEdit && <Button size="sm" variant="outline" onClick={() => openMarks(exam)}>Enter marks</Button>}</td>
                  </tr>
                ))}
                {exams.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No exams yet.</td></tr>}
              </tbody>
            </table>
          </Card>

          <Dialog open={!!marksExam} onOpenChange={(open) => !open && setMarksExam(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Marks - {marksExam?.name}</DialogTitle></DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {examStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between gap-3 border rounded-md p-2">
                    <span className="text-sm">{student.full_name}</span>
                    <Input type="number" min={0} max={marksExam?.total_marks} className="w-24" value={marks[student.id] ?? ""} onChange={(e) => setMarks({ ...marks, [student.id]: Number(e.target.value) })} />
                  </div>
                ))}
              </div>
              <DialogFooter><Button onClick={saveMarks}><Save className="h-4 w-4 mr-1" />Save marks</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Student Report Card</CardTitle></CardHeader>
            <CardContent>
              <Select value={reportStudent} onValueChange={setReportStudent}>
                <SelectTrigger className="w-72 mb-4"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.full_name}</SelectItem>)}</SelectContent>
              </Select>
              {reportStudent && (
                <>
                  <table className="w-full text-sm border">
                    <thead className="bg-muted/50"><tr><th className="p-2 text-left border">Exam</th><th className="p-2 text-left border">Subject</th><th className="p-2 border">Marks</th><th className="p-2 border">Total</th><th className="p-2 border">Grade</th></tr></thead>
                    <tbody>{report.map((row, index) => (<tr key={index}><td className="p-2 border">{row.exam}</td><td className="p-2 border">{row.subject}</td><td className="p-2 border text-center">{row.marks}</td><td className="p-2 border text-center">{row.total}</td><td className="p-2 border text-center font-semibold">{row.grade}</td></tr>))}
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
