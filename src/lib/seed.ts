import { supabase } from "@/integrations/supabase/client";

const FIRST = ["Liam","Olivia","Noah","Emma","Oliver","Ava","Elijah","Charlotte","James","Sophia"];
const LAST = ["Smith","Johnson","Brown","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas"];
const GENDERS = ["male","female","male","female","male","female","male","female","male","female"] as const;

export async function ensureSeed() {
  const { count } = await supabase.from("students").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;

  // Teachers
  const { data: teachers } = await supabase.from("teachers").insert([
    { full_name: "Sarah Mitchell", email: "sarah@school.edu", phone: "555-0101", department: "Sciences", subject: "Mathematics", qualifications: "M.Sc. Mathematics" },
    { full_name: "David Chen", email: "david@school.edu", phone: "555-0102", department: "Languages", subject: "English", qualifications: "M.A. English Literature" },
  ]).select();

  // Classes
  const { data: classes } = await supabase.from("classes").insert([
    { name: "Grade 1 - A", grade: 1, section: "A", class_teacher_id: teachers?.[0].id },
    { name: "Grade 5 - B", grade: 5, section: "B", class_teacher_id: teachers?.[1].id },
    { name: "Grade 10 - A", grade: 10, section: "A", class_teacher_id: teachers?.[0].id },
  ]).select();

  // Subjects
  await supabase.from("subjects").insert([
    { name: "Mathematics", code: "MATH", class_id: classes?.[0].id, teacher_id: teachers?.[0].id },
    { name: "English", code: "ENG", class_id: classes?.[0].id, teacher_id: teachers?.[1].id },
    { name: "Mathematics", code: "MATH", class_id: classes?.[1].id, teacher_id: teachers?.[0].id },
    { name: "English", code: "ENG", class_id: classes?.[1].id, teacher_id: teachers?.[1].id },
    { name: "Mathematics", code: "MATH", class_id: classes?.[2].id, teacher_id: teachers?.[0].id },
    { name: "English", code: "ENG", class_id: classes?.[2].id, teacher_id: teachers?.[1].id },
  ]);

  // Students
  const studentRows = Array.from({ length: 10 }).map((_, i) => ({
    full_name: `${FIRST[i]} ${LAST[i]}`,
    dob: new Date(2010 + (i % 5), i % 12, (i % 27) + 1).toISOString().slice(0, 10),
    gender: GENDERS[i],
    class_id: classes?.[i % 3].id,
    parent_name: `Parent of ${FIRST[i]}`,
    parent_contact: `555-02${String(i).padStart(2, "0")}`,
    parent_email: `parent${i}@example.com`,
    status: "active",
  }));
  const { data: students } = await supabase.from("students").insert(studentRows).select();

  // Attendance — last 14 days
  const attendance = [];
  const today = new Date();
  for (const s of students ?? []) {
    for (let d = 0; d < 14; d++) {
      const date = new Date(today); date.setDate(date.getDate() - d);
      const r = Math.random();
      const status: "present" | "absent" | "late" = r > 0.85 ? "absent" : r > 0.78 ? "late" : "present";
      attendance.push({ student_id: s.id, class_id: s.class_id, date: date.toISOString().slice(0, 10), status });
    }
  }
  await supabase.from("attendance").insert(attendance);

  // Fees
  const { data: feeStructs } = await supabase.from("fee_structures").insert(
    (classes ?? []).map(c => ({ class_id: c.id, term: "Term 1", amount: 500 + c.grade * 50, description: `Tuition fees for ${c.name}` }))
  ).select();

  const invoices = (students ?? []).map((s, i) => {
    const fs = feeStructs?.find(f => f.class_id === s.class_id);
    const total = Number(fs?.amount ?? 500);
    const paid = i % 3 === 0 ? total : i % 3 === 1 ? total / 2 : 0;
    return {
      student_id: s.id,
      fee_structure_id: fs?.id,
      term: "Term 1",
      total_amount: total,
      paid_amount: paid,
      status: (paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid") as "paid"|"partial"|"unpaid",
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    };
  });
  await supabase.from("invoices").insert(invoices);

  // Announcements
  await supabase.from("announcements").insert([
    { title: "Welcome to the New Term!", content: "We're excited to welcome all students back. Let's make this term great.", audience: "all" },
    { title: "Parent-Teacher Meeting", content: "PTM scheduled for next Friday at 3 PM in the main hall.", audience: "all" },
  ]);
}
