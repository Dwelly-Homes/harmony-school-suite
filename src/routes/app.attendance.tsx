import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Save } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { getAllAttendance, getAttendanceByClassAndDate, getAttendanceForStudentBetween, getClasses, getStudents, saveAttendanceForClass } from "@/data/mockData";

export const Route = createFileRoute("/app/attendance")({ component: AttendancePage });

type Status = "present" | "absent" | "late";

function AttendancePage() {
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "teacher";
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [calStudent, setCalStudent] = useState<string>("");
  const [calMonth, setCalMonth] = useState(new Date());
  const [calData, setCalData] = useState<Record<string, Status>>({});

  useEffect(() => {
    setClasses(getClasses().map(({ id, name }) => ({ id, name })));
  }, []);

  useEffect(() => {
    if (!classId) return;
    setStudents(getStudents().filter((student) => student.class_id === classId).map(({ id, full_name }) => ({ id, full_name })));
    setMarks({});
    loadDate();
  }, [classId, date]);

  const loadDate = () => {
    if (!classId) return;
    const nextMarks: Record<string, Status> = {};
    getAttendanceByClassAndDate(classId, date).forEach((row) => {
      nextMarks[row.student_id] = row.status as Status;
    });
    setMarks(nextMarks);
  };

  const setStatus = (studentId: string, status: Status) => setMarks({ ...marks, [studentId]: status });
  const setAll = (status: Status) => setMarks(Object.fromEntries(students.map((student) => [student.id, status])));

  const save = () => {
    saveAttendanceForClass(classId, date, Object.fromEntries(students.map((student) => [student.id, (marks[student.id] ?? "present") as Status])));
    toast.success("Attendance saved");
  };

  useEffect(() => {
    if (!calStudent) return;
    const start = format(startOfMonth(calMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(calMonth), "yyyy-MM-dd");
    const nextData: Record<string, Status> = {};
    getAttendanceForStudentBetween(calStudent, start, end).forEach((row) => {
      nextData[row.date] = row.status as Status;
    });
    setCalData(nextData);
  }, [calStudent, calMonth]);

  const exportCSV = () => {
    const data = getAllAttendance();
    const csv = ["date,student_id,class_id,status", ...data.map((row) => `${row.date},${row.student_id},${row.class_id},${row.status}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Attendance" description="Mark daily attendance and view monthly reports." actions={<Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>} />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Daily Marking</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={classId} onValueChange={setClassId}><SelectTrigger className="sm:w-64"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 px-3 rounded-md border bg-background" />
            {canEdit && classId && students.length > 0 && <>
              <Button variant="outline" size="sm" onClick={() => setAll("present")}>All Present</Button>
              <Button onClick={save}><Save className="h-4 w-4 mr-1" />Save</Button>
            </>}
          </div>
          {classId && <div className="space-y-2">
            {students.map((student) => {
              const current = marks[student.id] ?? "present";
              return (
                <div key={student.id} className="flex items-center justify-between border rounded-lg p-3">
                  <span className="font-medium">{student.full_name}</span>
                  <div className="flex gap-1">
                    {(["present", "late", "absent"] as Status[]).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={current === status ? "default" : "outline"}
                        disabled={!canEdit}
                        className={`capitalize ${current === status && status === "present" ? "bg-success hover:bg-success/90" : ""} ${current === status && status === "late" ? "bg-warning text-warning-foreground hover:bg-warning/90" : ""} ${current === status && status === "absent" ? "bg-destructive hover:bg-destructive/90" : ""}`}
                        onClick={() => setStatus(student.id, status)}
                      >
                        {status}
                      </Button>
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
            <Select value={calStudent} onValueChange={setCalStudent}><SelectTrigger className="sm:w-64"><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <input type="month" value={format(calMonth, "yyyy-MM")} onChange={(e) => setCalMonth(new Date(`${e.target.value}-01`))} className="h-10 px-3 rounded-md border bg-background" />
          </div>
          {calStudent ? (
            <div className="grid grid-cols-7 gap-2">
              {eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) }).map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const status = calData[key];
                const classesForDay = status === "present" ? "bg-success/15 text-success border-success/30" : status === "late" ? "bg-warning/15 text-warning-foreground border-warning/30" : status === "absent" ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-muted";
                return <div key={key} className={`aspect-square rounded-md border flex items-center justify-center text-sm ${classesForDay}`}>{format(day, "d")}</div>;
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
