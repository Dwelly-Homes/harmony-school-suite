const DATA_KEY = "harmony-school-demo-data";
const AUTH_KEY = "harmony-school-demo-auth";
const ACCOUNTS_KEY = "harmony-school-demo-accounts";

const clone = (value) => JSON.parse(JSON.stringify(value));
const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const isoNow = () => new Date().toISOString();
const dateOnly = (value) => new Date(value).toISOString().slice(0, 10);

const defaultTeachers = [
  { id: "teacher-1", full_name: "Grace Wanjiku", email: "grace.wanjiku@school.com", phone: "+254700111222", department: "Sciences", subject: "Mathematics", qualifications: "B.Ed Mathematics" },
  { id: "teacher-2", full_name: "Daniel Otieno", email: "daniel.otieno@school.com", phone: "+254700333444", department: "Languages", subject: "English", qualifications: "B.Ed English & Literature" },
  { id: "teacher-3", full_name: "Faith Njeri", email: "faith.njeri@school.com", phone: "+254700555666", department: "Humanities", subject: "Biology", qualifications: "B.Sc Biology, PGDE" },
];

const defaultClasses = [
  { id: "class-10", name: "Grade 10", grade: 10, section: "A", class_teacher_id: "teacher-1" },
  { id: "class-11", name: "Grade 11", grade: 11, section: "A", class_teacher_id: "teacher-2" },
  { id: "class-12", name: "Grade 12", grade: 12, section: "A", class_teacher_id: "teacher-3" },
];

const defaultSubjects = [
  { id: "subject-1", name: "Mathematics", code: "MTH101", class_id: "class-10", teacher_id: "teacher-1" },
  { id: "subject-2", name: "English", code: "ENG101", class_id: "class-10", teacher_id: "teacher-2" },
  { id: "subject-3", name: "Biology", code: "BIO101", class_id: "class-10", teacher_id: "teacher-3" },
  { id: "subject-4", name: "Mathematics", code: "MTH201", class_id: "class-11", teacher_id: "teacher-1" },
  { id: "subject-5", name: "English", code: "ENG201", class_id: "class-11", teacher_id: "teacher-2" },
  { id: "subject-6", name: "Biology", code: "BIO201", class_id: "class-11", teacher_id: "teacher-3" },
  { id: "subject-7", name: "Mathematics", code: "MTH301", class_id: "class-12", teacher_id: "teacher-1" },
  { id: "subject-8", name: "English", code: "ENG301", class_id: "class-12", teacher_id: "teacher-2" },
  { id: "subject-9", name: "Biology", code: "BIO301", class_id: "class-12", teacher_id: "teacher-3" },
];

const defaultStudents = [
  { id: "student-1", full_name: "Amina Hassan", dob: "2009-02-14", gender: "female", class_id: "class-10", parent_name: "Hassan Ali", parent_contact: "+254711000101", parent_email: "hassan.ali@email.com", status: "active", photo_url: null, admission_date: "2026-01-10" },
  { id: "student-2", full_name: "Brian Mwangi", dob: "2008-11-02", gender: "male", class_id: "class-10", parent_name: "Jane Mwangi", parent_contact: "+254711000102", parent_email: "jane.mwangi@email.com", status: "active", photo_url: null, admission_date: "2026-01-15" },
  { id: "student-3", full_name: "Chloe Atieno", dob: "2009-06-21", gender: "female", class_id: "class-10", parent_name: "Peter Atieno", parent_contact: "+254711000103", parent_email: "peter.atieno@email.com", status: "active", photo_url: null, admission_date: "2026-02-03" },
  { id: "student-4", full_name: "David Kiptoo", dob: "2008-09-18", gender: "male", class_id: "class-11", parent_name: "Mercy Kiptoo", parent_contact: "+254711000104", parent_email: "mercy.kiptoo@email.com", status: "active", photo_url: null, admission_date: "2026-02-12" },
  { id: "student-5", full_name: "Esther Naliaka", dob: "2008-03-27", gender: "female", class_id: "class-11", parent_name: "Samuel Naliaka", parent_contact: "+254711000105", parent_email: "samuel.naliaka@email.com", status: "active", photo_url: null, admission_date: "2026-03-01" },
  { id: "student-6", full_name: "Frank Ouma", dob: "2007-12-09", gender: "male", class_id: "class-11", parent_name: "Alice Ouma", parent_contact: "+254711000106", parent_email: "alice.ouma@email.com", status: "active", photo_url: null, admission_date: "2026-03-19" },
  { id: "student-7", full_name: "Gloria Muthoni", dob: "2007-07-30", gender: "female", class_id: "class-12", parent_name: "Joseph Muthoni", parent_contact: "+254711000107", parent_email: "joseph.muthoni@email.com", status: "active", photo_url: null, admission_date: "2026-04-02" },
  { id: "student-8", full_name: "Henry Kibet", dob: "2007-10-11", gender: "male", class_id: "class-12", parent_name: "Naomi Kibet", parent_contact: "+254711000108", parent_email: "naomi.kibet@email.com", status: "active", photo_url: null, admission_date: "2026-04-09" },
  { id: "student-9", full_name: "Ivy Chebet", dob: "2008-01-25", gender: "female", class_id: "class-12", parent_name: "Patrick Chebet", parent_contact: "+254711000109", parent_email: "patrick.chebet@email.com", status: "active", photo_url: null, admission_date: "2026-04-20" },
  { id: "student-10", full_name: "Joel Kamau", dob: "2009-04-05", gender: "male", class_id: "class-10", parent_name: "Lucy Kamau", parent_contact: "+254711000110", parent_email: "lucy.kamau@email.com", status: "active", photo_url: null, admission_date: "2026-05-01" },
];

const buildAttendance = () => {
  const rows = [];
  const today = new Date();
  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue;
    const date = dateOnly(day);
    defaultStudents.forEach((student, index) => {
      let status = "present";
      if ((index + offset) % 11 === 0) status = "absent";
      else if ((index + offset) % 5 === 0) status = "late";
      rows.push({ id: uid("attendance"), student_id: student.id, class_id: student.class_id, date, status });
    });
  }
  return rows;
};

const defaultFeeStructures = [
  { id: "fee-struct-1", class_id: "class-10", term: "Term 1", amount: 450, description: "Tuition and activity fee" },
  { id: "fee-struct-2", class_id: "class-11", term: "Term 1", amount: 500, description: "Tuition and lab fee" },
  { id: "fee-struct-3", class_id: "class-12", term: "Term 1", amount: 550, description: "Tuition, lab, and exam prep fee" },
];

const defaultInvoices = [
  { id: "invoice-1", student_id: "student-1", fee_structure_id: "fee-struct-1", term: "Term 1", total_amount: 450, paid_amount: 450, status: "paid", due_date: "2026-02-15", created_at: "2026-01-20T09:00:00.000Z" },
  { id: "invoice-2", student_id: "student-2", fee_structure_id: "fee-struct-1", term: "Term 1", total_amount: 450, paid_amount: 250, status: "partial", due_date: "2026-02-15", created_at: "2026-01-20T09:10:00.000Z" },
  { id: "invoice-3", student_id: "student-4", fee_structure_id: "fee-struct-2", term: "Term 1", total_amount: 500, paid_amount: 0, status: "unpaid", due_date: "2026-02-20", created_at: "2026-01-21T08:30:00.000Z" },
  { id: "invoice-4", student_id: "student-7", fee_structure_id: "fee-struct-3", term: "Term 1", total_amount: 550, paid_amount: 550, status: "paid", due_date: "2026-02-25", created_at: "2026-01-22T11:15:00.000Z" },
  { id: "invoice-5", student_id: "student-9", fee_structure_id: "fee-struct-3", term: "Term 1", total_amount: 550, paid_amount: 300, status: "partial", due_date: "2026-02-25", created_at: "2026-01-22T11:20:00.000Z" },
];

const defaultPayments = [
  { id: "payment-1", invoice_id: "invoice-1", amount: 450, payment_date: "2026-01-25", method: "bank" },
  { id: "payment-2", invoice_id: "invoice-2", amount: 250, payment_date: "2026-01-28", method: "cash" },
  { id: "payment-3", invoice_id: "invoice-4", amount: 550, payment_date: "2026-01-30", method: "mobile money" },
  { id: "payment-4", invoice_id: "invoice-5", amount: 300, payment_date: "2026-02-02", method: "cash" },
];

const defaultExams = [
  { id: "exam-1", name: "Math CAT 1", term: "Term 1", class_id: "class-10", subject_id: "subject-1", total_marks: 100, exam_date: "2026-03-10", created_at: "2026-03-01T08:00:00.000Z" },
  { id: "exam-2", name: "English CAT 1", term: "Term 1", class_id: "class-10", subject_id: "subject-2", total_marks: 100, exam_date: "2026-03-12", created_at: "2026-03-02T08:00:00.000Z" },
  { id: "exam-3", name: "Biology Practical", term: "Term 1", class_id: "class-11", subject_id: "subject-6", total_marks: 100, exam_date: "2026-03-15", created_at: "2026-03-03T08:00:00.000Z" },
  { id: "exam-4", name: "Math Mock", term: "Term 1", class_id: "class-12", subject_id: "subject-7", total_marks: 100, exam_date: "2026-03-18", created_at: "2026-03-04T08:00:00.000Z" },
  { id: "exam-5", name: "English Essay", term: "Term 1", class_id: "class-12", subject_id: "subject-8", total_marks: 100, exam_date: "2026-03-20", created_at: "2026-03-05T08:00:00.000Z" },
];

const defaultGrades = [
  { id: "grade-1", exam_id: "exam-1", student_id: "student-1", marks: 95, grade: "A" },
  { id: "grade-2", exam_id: "exam-2", student_id: "student-2", marks: 84, grade: "B" },
  { id: "grade-3", exam_id: "exam-3", student_id: "student-4", marks: 73, grade: "C" },
  { id: "grade-4", exam_id: "exam-4", student_id: "student-7", marks: 62, grade: "D" },
  { id: "grade-5", exam_id: "exam-5", student_id: "student-8", marks: 41, grade: "F" },
];

const defaultAnnouncements = [
  { id: "announcement-1", title: "Mid-term exams start next Monday", content: "Students should report by 7:30 AM and carry all required stationery for the exam week.", audience: "all", class_id: null, author_id: "admin-user", created_at: "2026-04-28T07:30:00.000Z" },
  { id: "announcement-2", title: "Grade 12 career guidance session", content: "Parents and students are invited to the hall on Friday at 2:00 PM for the university application briefing.", audience: "class", class_id: "class-12", author_id: "teacher-user", created_at: "2026-05-02T10:00:00.000Z" },
];

const defaultAccounts = [
  { id: "admin-user", email: "admin@school.com", password: "password123", role: "admin", full_name: "Demo Admin" },
  { id: "teacher-user", email: "teacher@school.com", password: "password123", role: "teacher", full_name: "Demo Teacher" },
  { id: "parent-user", email: "parent@school.com", password: "password123", role: "parent", full_name: "Demo Parent" },
];

const buildDefaultStore = () => ({
  students: clone(defaultStudents),
  teachers: clone(defaultTeachers),
  classes: clone(defaultClasses),
  subjects: clone(defaultSubjects),
  attendance: buildAttendance(),
  fee_structures: clone(defaultFeeStructures),
  invoices: clone(defaultInvoices),
  payments: clone(defaultPayments),
  exams: clone(defaultExams),
  grades: clone(defaultGrades),
  announcements: clone(defaultAnnouncements),
});

const authListeners = new Set();

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadLocal(key, fallback) {
  if (!canUseStorage()) return clone(fallback);
  const raw = window.localStorage.getItem(key);
  if (!raw) return clone(fallback);
  try {
    return JSON.parse(raw);
  } catch {
    return clone(fallback);
  }
}

function saveLocal(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

let store = loadLocal(DATA_KEY, buildDefaultStore());
let accounts = loadLocal(ACCOUNTS_KEY, defaultAccounts);
let currentAuth = loadLocal(AUTH_KEY, null);

function persistStore() {
  saveLocal(DATA_KEY, store);
}

function persistAccounts() {
  saveLocal(ACCOUNTS_KEY, accounts);
}

function persistAuth() {
  saveLocal(AUTH_KEY, currentAuth);
}

function emitAuth() {
  authListeners.forEach((listener) => listener(getSession()));
}

function sortByName(rows) {
  return clone(rows).sort((a, b) => (a.full_name || a.name || "").localeCompare(b.full_name || b.name || ""));
}

function getAccountPublicShape(account) {
  return { id: account.id, email: account.email, role: account.role, full_name: account.full_name };
}

export const DEMO_ACCOUNTS = defaultAccounts.map(({ email, password, role }) => ({
  email,
  password,
  role: role[0].toUpperCase() + role.slice(1),
}));

export function getSession() {
  return currentAuth ? { user: clone(currentAuth) } : null;
}

export function subscribeToAuth(listener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export function signInDemo(email, password) {
  const account = accounts.find((item) => item.email.toLowerCase() === email.toLowerCase().trim() && item.password === password);
  if (!account) throw new Error("Invalid email or password");
  currentAuth = getAccountPublicShape(account);
  persistAuth();
  emitAuth();
  return getSession();
}

export function signUpDemo({ name, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  if (accounts.some((item) => item.email.toLowerCase() === normalizedEmail)) throw new Error("An account with this email already exists");
  const account = { id: uid("user"), email: normalizedEmail, password, role: "parent", full_name: name?.trim() || "New Parent" };
  accounts.push(account);
  persistAccounts();
  currentAuth = getAccountPublicShape(account);
  persistAuth();
  emitAuth();
  return getSession();
}

export function signOutDemo() {
  currentAuth = null;
  persistAuth();
  emitAuth();
}

export function syncFromStorage() {
  if (!canUseStorage()) return;
  store = loadLocal(DATA_KEY, buildDefaultStore());
  accounts = loadLocal(ACCOUNTS_KEY, defaultAccounts);
  currentAuth = loadLocal(AUTH_KEY, null);
}

export function getStudents() {
  return sortByName(store.students);
}

export function getTeachers() {
  return sortByName(store.teachers);
}

export function getClasses() {
  return clone(store.classes).sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
}

export function getSubjects() {
  return clone(store.subjects).sort((a, b) => a.name.localeCompare(b.name));
}

export function saveStudent(payload) {
  if (payload.id) store.students = store.students.map((student) => (student.id === payload.id ? { ...student, ...payload } : student));
  else store.students.push({ id: uid("student"), admission_date: dateOnly(new Date()), photo_url: null, ...payload });
  persistStore();
}

export function deleteStudent(id) {
  store.students = store.students.filter((student) => student.id !== id);
  store.attendance = store.attendance.filter((row) => row.student_id !== id);
  store.invoices = store.invoices.filter((invoice) => invoice.student_id !== id);
  store.grades = store.grades.filter((grade) => grade.student_id !== id);
  persistStore();
}

export function saveTeacher(payload) {
  if (payload.id) store.teachers = store.teachers.map((teacher) => (teacher.id === payload.id ? { ...teacher, ...payload } : teacher));
  else store.teachers.push({ id: uid("teacher"), ...payload });
  persistStore();
}

export function deleteTeacher(id) {
  store.teachers = store.teachers.filter((teacher) => teacher.id !== id);
  store.classes = store.classes.map((item) => (item.class_teacher_id === id ? { ...item, class_teacher_id: null } : item));
  store.subjects = store.subjects.map((item) => (item.teacher_id === id ? { ...item, teacher_id: null } : item));
  persistStore();
}

export function saveClass(payload) {
  if (payload.id) store.classes = store.classes.map((item) => (item.id === payload.id ? { ...item, ...payload } : item));
  else store.classes.push({ id: uid("class"), ...payload });
  persistStore();
}

export function saveSubject(payload) {
  if (payload.id) store.subjects = store.subjects.map((item) => (item.id === payload.id ? { ...item, ...payload } : item));
  else store.subjects.push({ id: uid("subject"), ...payload });
  persistStore();
}

export function getAttendanceByClassAndDate(classId, date) {
  return clone(store.attendance.filter((row) => row.class_id === classId && row.date === date));
}

export function getAttendanceForStudentBetween(studentId, start, end) {
  return clone(store.attendance.filter((row) => row.student_id === studentId && row.date >= start && row.date <= end).sort((a, b) => a.date.localeCompare(b.date)));
}

export function getAllAttendance() {
  return clone(store.attendance).sort((a, b) => a.date.localeCompare(b.date));
}

export function saveAttendanceForClass(classId, date, marksByStudent) {
  const studentIds = new Set(getStudents().filter((student) => student.class_id === classId).map((student) => student.id));
  store.attendance = store.attendance.filter((row) => !(row.class_id === classId && row.date === date && studentIds.has(row.student_id)));
  Object.entries(marksByStudent).forEach(([studentId, status]) => {
    store.attendance.push({ id: uid("attendance"), student_id: studentId, class_id: classId, date, status });
  });
  persistStore();
}

export function getFeeStructures() {
  return clone(store.fee_structures);
}

export function getInvoices() {
  return clone(store.invoices).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getPayments() {
  return clone(store.payments).sort((a, b) => b.payment_date.localeCompare(a.payment_date));
}

export function saveFeeStructure(payload) {
  store.fee_structures.push({ id: uid("fee-structure"), ...payload });
  persistStore();
}

export function generateInvoicesForStructure(structureId) {
  const structure = store.fee_structures.find((item) => item.id === structureId);
  if (!structure) return 0;
  const targets = store.students.filter((student) => student.class_id === structure.class_id);
  const createdAt = isoNow();
  targets.forEach((student) => {
    store.invoices.push({
      id: uid("invoice"),
      student_id: student.id,
      fee_structure_id: structure.id,
      term: structure.term,
      total_amount: structure.amount,
      paid_amount: 0,
      status: "unpaid",
      due_date: dateOnly(Date.now() + 30 * 86400000),
      created_at: createdAt,
    });
  });
  persistStore();
  return targets.length;
}

export function recordInvoicePayment(invoiceId, amount) {
  const invoice = store.invoices.find((item) => item.id === invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  const newPaid = Number(invoice.paid_amount) + Number(amount);
  invoice.paid_amount = newPaid;
  invoice.status = newPaid >= Number(invoice.total_amount) ? "paid" : newPaid > 0 ? "partial" : "unpaid";
  store.payments.push({ id: uid("payment"), invoice_id: invoiceId, amount: Number(amount), payment_date: dateOnly(new Date()), method: "cash" });
  persistStore();
}

export function getExams() {
  return clone(store.exams).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveExam(payload) {
  if (payload.id) store.exams = store.exams.map((item) => (item.id === payload.id ? { ...item, ...payload } : item));
  else store.exams.push({ id: uid("exam"), created_at: isoNow(), ...payload });
  persistStore();
}

export function getGradesForExam(examId) {
  return clone(store.grades.filter((item) => item.exam_id === examId));
}

export function saveGradesForExam(examId, rows) {
  const keep = store.grades.filter((item) => item.exam_id !== examId);
  store.grades = [...keep, ...rows.map((row) => ({ id: uid("grade"), exam_id: examId, ...row }))];
  persistStore();
}

export function getGradesForStudent(studentId) {
  return clone(store.grades.filter((item) => item.student_id === studentId));
}

export function getAnnouncements() {
  return clone(store.announcements).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveAnnouncement(payload) {
  store.announcements.unshift({ id: uid("announcement"), created_at: isoNow(), ...payload });
  persistStore();
}

export function deleteAnnouncement(id) {
  store.announcements = store.announcements.filter((item) => item.id !== id);
  persistStore();
}

export function getDashboardSnapshot() {
  const attendance = getAllAttendance();
  const present = attendance.filter((row) => row.status === "present").length;
  return {
    students: getStudents(),
    teachers: getTeachers(),
    classes: getClasses(),
    attendance,
    announcements: getAnnouncements(),
    attendanceRate: attendance.length ? Math.round((present / attendance.length) * 100) : 0,
  };
}
