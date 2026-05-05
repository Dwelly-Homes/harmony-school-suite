import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/fees")({ component: FeesPage });

type Inv = { id: string; student_id: string; term: string|null; total_amount: number; paid_amount: number; status: "paid"|"partial"|"unpaid"; due_date: string|null };
type Pay = { id: string; invoice_id: string; amount: number; payment_date: string; method: string|null };

function FeesPage() {
  const { role } = useAuth();
  const canEdit = role === "admin";
  const [classes, setClasses] = useState<{id:string;name:string}[]>([]);
  const [students, setStudents] = useState<{id:string;full_name:string;class_id:string|null}[]>([]);
  const [structures, setStructures] = useState<{id:string;class_id:string|null;term:string;amount:number;description:string|null}[]>([]);
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [payments, setPayments] = useState<Pay[]>([]);
  const [newStruct, setNewStruct] = useState<{class_id?:string;term?:string;amount?:number;description?:string}|null>(null);
  const [recordPay, setRecordPay] = useState<Inv|null>(null);
  const [payAmt, setPayAmt] = useState<number>(0);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [c, s, fs, inv, p] = await Promise.all([
      supabase.from("classes").select("id,name"),
      supabase.from("students").select("id,full_name,class_id"),
      supabase.from("fee_structures").select("*"),
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("payment_date", { ascending: false }),
    ]);
    setClasses(c.data ?? []); setStudents(s.data ?? []); setStructures(fs.data ?? []);
    setInvoices((inv.data as Inv[]) ?? []); setPayments((p.data as Pay[]) ?? []);
  };

  const studentName = (id: string) => students.find(s=>s.id===id)?.full_name ?? "—";
  const className = (id: string|null) => classes.find(c=>c.id===id)?.name ?? "—";
  const statusVariant = (s: string) => s==="paid"?"default":s==="partial"?"secondary":"destructive";

  const saveStruct = async () => {
    if (!newStruct?.amount || !newStruct.term) return toast.error("Term & amount required");
    const { error } = await supabase.from("fee_structures").insert({ class_id: newStruct.class_id ?? null, term: newStruct.term, amount: newStruct.amount, description: newStruct.description ?? null });
    if (error) return toast.error(error.message);
    setNewStruct(null); load();
  };

  const generateInvoices = async (fsId: string) => {
    const fs = structures.find(s => s.id === fsId);
    if (!fs) return;
    const cls = students.filter(s => s.class_id === fs.class_id);
    const rows = cls.map(s => ({ student_id: s.id, fee_structure_id: fs.id, term: fs.term, total_amount: fs.amount, paid_amount: 0, status: "unpaid" as const, due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10) }));
    const { error } = await supabase.from("invoices").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Generated ${rows.length} invoices`); load();
  };

  const recordPayment = async () => {
    if (!recordPay || payAmt <= 0) return;
    const newPaid = Number(recordPay.paid_amount) + payAmt;
    const status: Inv["status"] = newPaid >= recordPay.total_amount ? "paid" : newPaid > 0 ? "partial" : "unpaid";
    const { error: e1 } = await supabase.from("payments").insert({ invoice_id: recordPay.id, amount: payAmt, method: "cash" });
    const { error: e2 } = await supabase.from("invoices").update({ paid_amount: newPaid, status }).eq("id", recordPay.id);
    if (e1 || e2) return toast.error((e1 ?? e2)?.message ?? "Error");
    toast.success("Payment recorded"); setRecordPay(null); setPayAmt(0); load();
  };

  return (
    <div>
      <PageHeader title="Fees & Payments" description="Manage fee structures, invoices, and payments." />

      <Tabs defaultValue="invoices">
        <TabsList><TabsTrigger value="invoices">Invoices</TabsTrigger><TabsTrigger value="structures">Fee Structures</TabsTrigger><TabsTrigger value="payments">Payments</TabsTrigger></TabsList>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-3">Student</th><th className="p-3">Term</th><th className="p-3">Total</th><th className="p-3">Paid</th><th className="p-3">Outstanding</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
              <tbody>
                {invoices.map(i => (
                  <tr key={i.id} className="border-t">
                    <td className="p-3 font-medium">{studentName(i.student_id)}</td><td className="p-3">{i.term}</td>
                    <td className="p-3">${i.total_amount}</td><td className="p-3">${i.paid_amount}</td>
                    <td className="p-3">${Number(i.total_amount) - Number(i.paid_amount)}</td>
                    <td className="p-3"><Badge variant={statusVariant(i.status)} className="capitalize">{i.status}</Badge></td>
                    <td className="p-3 text-right">{canEdit && i.status !== "paid" && <Button size="sm" variant="outline" onClick={()=>{setRecordPay(i); setPayAmt(Number(i.total_amount)-Number(i.paid_amount));}}><DollarSign className="h-3 w-3 mr-1"/>Pay</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Dialog open={!!recordPay} onOpenChange={o=>!o && setRecordPay(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment — {recordPay && studentName(recordPay.student_id)}</DialogTitle></DialogHeader>
              <div><Label>Amount</Label><Input type="number" value={payAmt} onChange={e=>setPayAmt(Number(e.target.value))} /></div>
              <DialogFooter><Button onClick={recordPayment}>Record</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="structures" className="mt-4">
          {canEdit && <Dialog open={!!newStruct} onOpenChange={o=>!o && setNewStruct(null)}>
            <DialogTrigger asChild><Button className="mb-3" onClick={()=>setNewStruct({})}><Plus className="h-4 w-4 mr-1"/>New structure</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Fee Structure</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Class</Label><Select value={newStruct?.class_id??""} onValueChange={v=>setNewStruct({...newStruct, class_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Class"/></SelectTrigger>
                  <SelectContent>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select></div>
                <div><Label>Term</Label><Input value={newStruct?.term??""} onChange={e=>setNewStruct({...newStruct, term: e.target.value})} placeholder="Term 2"/></div>
                <div><Label>Amount</Label><Input type="number" value={newStruct?.amount??""} onChange={e=>setNewStruct({...newStruct, amount: Number(e.target.value)})}/></div>
                <div><Label>Description</Label><Input value={newStruct?.description??""} onChange={e=>setNewStruct({...newStruct, description: e.target.value})}/></div>
              </div>
              <DialogFooter><Button onClick={saveStruct}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {structures.map(s => (
              <Card key={s.id}><CardContent className="p-5">
                <div className="text-xs text-muted-foreground">{className(s.class_id)} • {s.term}</div>
                <div className="text-2xl font-bold mt-1">${s.amount}</div>
                <div className="text-sm text-muted-foreground">{s.description}</div>
                {canEdit && <Button size="sm" variant="outline" className="mt-3" onClick={()=>generateInvoices(s.id)}>Generate invoices</Button>}
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-3">Date</th><th className="p-3">Student</th><th className="p-3">Amount</th><th className="p-3">Method</th></tr></thead>
              <tbody>
                {payments.map(p => {
                  const inv = invoices.find(i=>i.id===p.invoice_id);
                  return <tr key={p.id} className="border-t"><td className="p-3">{p.payment_date}</td><td className="p-3">{inv ? studentName(inv.student_id) : "—"}</td><td className="p-3 font-medium">${p.amount}</td><td className="p-3 capitalize">{p.method ?? "—"}</td></tr>;
                })}
                {payments.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No payments recorded.</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
