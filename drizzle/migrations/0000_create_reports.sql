CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  transcript text NOT NULL DEFAULT '' CHECK (char_length(transcript) <= 4000),
  machine text NOT NULL CHECK (char_length(machine) BETWEEN 1 AND 40),
  problem text NOT NULL CHECK (char_length(problem) BETWEEN 1 AND 4000),
  category text NOT NULL CHECK (category IN ('Maintenance','Quality')),
  urgency text NOT NULL CHECK (urgency IN ('Low','Medium','High','Critical')),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','In Progress','Resolved')),
  language text NOT NULL DEFAULT 'English' CHECK (char_length(language) <= 40),
  reporter text NOT NULL DEFAULT 'Anonymous' CHECK (char_length(reporter) <= 80)
);
GRANT SELECT, INSERT, DELETE ON public.reports TO anon, authenticated;
GRANT UPDATE (status) ON public.reports TO anon, authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reports" ON public.reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can send new pending reports" ON public.reports FOR INSERT TO anon, authenticated WITH CHECK (status = 'Pending');
CREATE POLICY "Anyone can change report status" ON public.reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete reports" ON public.reports FOR DELETE TO anon, authenticated USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
INSERT INTO public.reports (created_at, transcript, machine, problem, category, urgency, status, language, reporter) VALUES
('2026-11-26T04:15:00Z','Machine M-12 hydraulic oil leak, press stopped','M-12','Hydraulic oil leak, press stopped','Maintenance','High','In Progress','English','Ramesh K.'),
('2026-11-26T06:40:00Z','Line L-3 cartons damaged during packing, around 40 pieces','L-3','Cartons damaged during packing, around 40 pieces','Quality','Medium','Pending','English','Priya S.'),
('2026-11-25T09:05:00Z','मशीन 7 से धुआं निकल रहा है','M-7','मशीन 7 से धुआं निकल रहा है (smoke from machine 7)','Maintenance','Critical','Resolved','Hindi','Suresh P.'),
('2026-11-25T11:30:00Z','CNC-4 parts have small scratches on finish','CNC-4','Parts have small scratches on finish','Quality','Low','Pending','English','Anita M.');