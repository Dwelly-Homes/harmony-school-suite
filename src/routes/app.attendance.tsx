import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Save } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/attendance")({ component: AttendancePage });

type Status = "present" | "absent" | "late";

function AttendancePage() {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "teacher";
  const [classes, setClasses] = useState<{id:string;name:string}[]>([]);
  const [students, setStudents] = useState<{id:string;full_name:string}[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [calStudent, setCalStudent] = useState<string>("");
  const [calMonth, setCalMonth] = useState(new Date());
  const [calData, setCalData] = useState<Record<string, Status>>({});

  useEffect(() => { supabase.from("classes").select("id,name").then(({data})=>setClasses(data??[])); }, []);
  useEffect(() => {
    if (!classId) return;
    supabase.from("students").select("id,full_name").eq("class_id", classId).then(({data})=>{ setStudents(data??[]); setMarks({}); });
    loadDate();
  }, [classId, date]);

  const loadDate = async () => {
    if (!classId) return;
    const { data } = await supabase.from("attendance").select("student_id,status").eq("class_id", classId).eq("date", date);
    const m: Record<string, Status> = {};
    data?.forEach(r => { m[r.student_id] = r.status as Status; });
    setMarks(m);
  };

  const set = (sid: string, status: Status) => setMarks({ ...marks, [sid]: status });
  const setAll = (status: Status) => setMarks(Object.fromEntries(students.map(s => [s.id, status])));

  const save = async () => {
    const rows = students.map(s => ({ student_id: s.id, class_id: classId, date, status: (marks[s.id] ?? "present") as Status }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,date" });
    if (error) return toast.error(error.message);
    toast.success("Attendance saved");
  };

  // Calendar
  useEffect(() => {
    if (!calStudent) return;
    const start = format(startOfMonth(calMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(calMonth), "yyyy-MM-dd");
    supabase.from("attendance").select("date,status").eq("student_id", calStudent).gte("date", start).lte("date", end).then(({data})=>{
      const m: Record<string, Status> = {}; data?.forEach(r=>{ m[r.date] = r.status as Status; }); setCalData(m);
    });
  }, [calStudent, calMonth]);

  const exportCSV = async () => {
    const { data } = await supabase.from("attendance").select("date,status,student_id,class_id").order("date");
    const csv = ["date,student_id,class_id,status", ...(data ?? []).map(r => `${r.date},${r.student_id},${r.class_id},${r.status}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "attendance.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Attendance" description="Mark daily attendance and view monthly reports."
        actions={<Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1"/>Export CSV</Button>} />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Daily Marking</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={classId} onValueChange={setClassId}><SelectTrigger className="sm:w-64"><SelectValue placeholder="Select class"/></SelectTrigger>
              <SelectContent>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="h-10 px-3 rounded-md border bg-background" />
            {canEdit && classId && students.length>0 && <>
              <Button variant="outline" size="sm" onClick={()=>setAll("present")}>All Present</Button>
              <Button onClick={save}><Save className="h-4 w-4 mr-1"/>Save</Button>
            </>}
          </div>
          {classId && <div className="space-y-2">
            {students.map(s => {
              const cur = marks[s.id] ?? "present";
              return (
                <div key={s.id} className="flex items-center justify-between border rounded-lg p-3">
                  <span className="font-medium">{s.full_name}</span>
                  <div className="flex gap-1">
                    {(["present","late","absent"] as Status[]).map(st => (
                      <Button key={st} size="sm" variant={cur===st?"default":"outline"} disabled={!canEdit}
                        className={`capitalize ${cur===st && st==="present"?"bg-success hover:bg-success/90":""} ${cur===st && st==="late"?"bg-warning text-warning-foreground hover:bg-warning/90":""} ${cur===st && st==="absent"?"bg-destructive hover:bg-destructive/90":""}`}
                        onClick={()=>set(s.id, st)}>{st}</Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Calendar</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={calStudent} onValueChange={setCalStudent}><SelectTrigger className="sm:w-64"><SelectValue placeholder="Select student"/></SelectTrigger>
              <SelectContent>{students.map(s=><SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <input type="month" value={format(calMonth, "yyyy-MM")} onChange={e=>setCalMonth(new Date(e.target.value+"-01"))} className="h-10 px-3 rounded-md border bg-background" />
          </div>
          {calStudent ? (
            <div className="grid grid-cols-7 gap-2">
              {eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) }).map(d => {
                const k = format(d, "yyyy-MM-dd");
                const st = calData[k];
                const cls = st === "present" ? "bg-success/15 text-success border-success/30" : st === "late" ? "bg-warning/15 text-warning-foreground border-warning/30" : st === "absent" ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-muted";
                return <div key={k} className={`aspect-square rounded-md border flex items-center justify-center text-sm ${cls}`}>{format(d, "d")}</div>;
              })}
            </div>
          ) : <div className="text-sm text-muted-foreground">Pick a class then student.</div>}
          <div className="flex gap-3 text-xs mt-4">
            <Badge className="bg-success">Present</Badge><Badge className="bg-warning text-warning-foreground">Late</Badge><Badge className="bg-destructive">Absent</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
