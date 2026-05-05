import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
import { generateInvoicesForStructure, getClasses, getFeeStructures, getInvoices, getPayments, getStudents, recordInvoicePayment, saveFeeStructure } from "@/data/mockData";

export const Route = createFileRoute("/app/fees")({ component: FeesPage });

type Inv = { id: string; student_id: string; term: string | null; total_amount: number; paid_amount: number; status: "paid" | "partial" | "unpaid"; due_date: string | null };
type Pay = { id: string; invoice_id: string; amount: number; payment_date: string; method: string | null };

function FeesPage() {
  const { role } = useAuth();
  const canEdit = role === "admin";
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string; class_id: string | null }[]>([]);
  const [structures, setStructures] = useState<{ id: string; class_id: string | null; term: string; amount: number; description: string | null }[]>([]);
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [payments, setPayments] = useState<Pay[]>([]);
  const [newStruct, setNewStruct] = useState<{ class_id?: string; term?: string; amount?: number; description?: string } | null>(null);
  const [recordPay, setRecordPay] = useState<Inv | null>(null);
  const [payAmt, setPayAmt] = useState<number>(0);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    setClasses(getClasses().map(({ id, name }) => ({ id, name })));
    setStudents(getStudents().map(({ id, full_name, class_id }) => ({ id, full_name, class_id })));
    setStructures(getFeeStructures());
    setInvoices(getInvoices() as Inv[]);
    setPayments(getPayments() as Pay[]);
  };

  const studentName = (id: string) => students.find((student) => student.id === id)?.full_name ?? "-";
  const className = (id: string | null) => classes.find((item) => item.id === id)?.name ?? "-";
  const statusVariant = (status: string) => status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive";

  const saveStruct = () => {
    if (!newStruct?.amount || !newStruct.term) return toast.error("Term & amount required");
    saveFeeStructure({ class_id: newStruct.class_id ?? null, term: newStruct.term, amount: newStruct.amount, description: newStruct.description ?? null });
    setNewStruct(null);
    load();
  };

  const generateInvoices = (structureId: string) => {
    const count = generateInvoicesForStructure(structureId);
    toast.success(`Generated ${count} invoices`);
    load();
  };

  const recordPayment = () => {
    if (!recordPay || payAmt <= 0) return;
    recordInvoicePayment(recordPay.id, payAmt);
    toast.success("Payment recorded");
    setRecordPay(null);
    setPayAmt(0);
    load();
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t">
                    <td className="p-3 font-medium">{studentName(invoice.student_id)}</td><td className="p-3">{invoice.term}</td>
                    <td className="p-3">${invoice.total_amount}</td><td className="p-3">${invoice.paid_amount}</td>
                    <td className="p-3">${Number(invoice.total_amount) - Number(invoice.paid_amount)}</td>
                    <td className="p-3"><Badge variant={statusVariant(invoice.status)} className="capitalize">{invoice.status}</Badge></td>
                    <td className="p-3 text-right">{canEdit && invoice.status !== "paid" && <Button size="sm" variant="outline" onClick={() => { setRecordPay(invoice); setPayAmt(Number(invoice.total_amount) - Number(invoice.paid_amount)); }}><DollarSign className="h-3 w-3 mr-1" />Pay</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Dialog open={!!recordPay} onOpenChange={(open) => !open && setRecordPay(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment - {recordPay && studentName(recordPay.student_id)}</DialogTitle></DialogHeader>
              <div><Label>Amount</Label><Input type="number" value={payAmt} onChange={(e) => setPayAmt(Number(e.target.value))} /></div>
              <DialogFooter><Button onClick={recordPayment}>Record</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="structures" className="mt-4">
          {canEdit && <Dialog open={!!newStruct} onOpenChange={(open) => !open && setNewStruct(null)}>
            <DialogTrigger asChild><Button className="mb-3" onClick={() => setNewStruct({})}><Plus className="h-4 w-4 mr-1" />New structure</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Fee Structure</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Class</Label><Select value={newStruct?.class_id ?? ""} onValueChange={(value) => setNewStruct({ ...newStruct, class_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select></div>
                <div><Label>Term</Label><Input value={newStruct?.term ?? ""} onChange={(e) => setNewStruct({ ...newStruct, term: e.target.value })} placeholder="Term 2" /></div>
                <div><Label>Amount</Label><Input type="number" value={newStruct?.amount ?? ""} onChange={(e) => setNewStruct({ ...newStruct, amount: Number(e.target.value) })} /></div>
                <div><Label>Description</Label><Input value={newStruct?.description ?? ""} onChange={(e) => setNewStruct({ ...newStruct, description: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={saveStruct}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {structures.map((structure) => (
              <Card key={structure.id}><CardContent className="p-5">
                <div className="text-xs text-muted-foreground">{className(structure.class_id)} - {structure.term}</div>
                <div className="text-2xl font-bold mt-1">${structure.amount}</div>
                <div className="text-sm text-muted-foreground">{structure.description}</div>
                {canEdit && <Button size="sm" variant="outline" className="mt-3" onClick={() => generateInvoices(structure.id)}>Generate invoices</Button>}
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-3">Date</th><th className="p-3">Student</th><th className="p-3">Amount</th><th className="p-3">Method</th></tr></thead>
              <tbody>
                {payments.map((payment) => {
                  const invoice = invoices.find((item) => item.id === payment.invoice_id);
                  return <tr key={payment.id} className="border-t"><td className="p-3">{payment.payment_date}</td><td className="p-3">{invoice ? studentName(invoice.student_id) : "-"}</td><td className="p-3 font-medium">${payment.amount}</td><td className="p-3 capitalize">{payment.method ?? "-"}</td></tr>;
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
