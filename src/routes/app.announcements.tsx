import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/announcements")({ component: AnnouncementsPage });

type Ann = { id: string; title: string; content: string; audience: string; class_id: string|null; created_at: string };

function AnnouncementsPage() {
  const { role, user } = useAuth();
  const canEdit = role === "admin" || role === "teacher";
  const [items, setItems] = useState<Ann[]>([]);
  const [classes, setClasses] = useState<{id:string;name:string}[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{title?:string;content?:string;audience?:string;class_id?:string|null}>({ audience: "all" });

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [a, c] = await Promise.all([
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("classes").select("id,name"),
    ]);
    setItems((a.data as Ann[]) ?? []); setClasses(c.data ?? []);
  };

  const save = async () => {
    if (!draft.title || !draft.content) return toast.error("Title and content required");
    const { error } = await supabase.from("announcements").insert({
      title: draft.title, content: draft.content,
      audience: draft.audience ?? "all",
      class_id: draft.audience === "class" ? draft.class_id ?? null : null,
      author_id: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Posted"); setOpen(false); setDraft({ audience: "all" }); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete announcement?")) return;
    await supabase.from("announcements").delete().eq("id", id); load();
  };

  return (
    <div>
      <PageHeader title="Announcements" description="School-wide and class messages."
        actions={canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>New announcement</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={draft.title??""} onChange={e=>setDraft({...draft, title: e.target.value})} /></div>
                <div><Label>Content</Label><Textarea rows={6} value={draft.content??""} onChange={e=>setDraft({...draft, content: e.target.value})} placeholder="Write your message…" /></div>
                <div><Label>Audience</Label>
                  <Select value={draft.audience} onValueChange={v=>setDraft({...draft, audience: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="all">School-wide</SelectItem><SelectItem value="class">Specific class</SelectItem></SelectContent>
                  </Select>
                </div>
                {draft.audience === "class" && (
                  <div><Label>Class</Label>
                    <Select value={draft.class_id ?? ""} onValueChange={v=>setDraft({...draft, class_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select class"/></SelectTrigger>
                      <SelectContent>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter><Button onClick={save}>Post</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="space-y-3">
        {items.map(a => (
          <Card key={a.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Megaphone className="h-5 w-5"/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{a.title}</h3>
                    <Badge variant={a.audience === "all" ? "default" : "secondary"} className="capitalize">{a.audience === "all" ? "School-wide" : (classes.find(c=>c.id===a.class_id)?.name ?? "Class")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                  <div className="text-xs text-muted-foreground mt-2">{format(new Date(a.created_at), "PPp")}</div>
                </div>
                {canEdit && <Button size="icon" variant="ghost" onClick={()=>del(a.id)}><Trash2 className="h-4 w-4"/></Button>}
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No announcements yet.</CardContent></Card>}
      </div>
    </div>
  );
}
