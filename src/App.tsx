import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility, Activity, BookOpen, BriefcaseBusiness, Check, ChevronDown, CircleHelp,
  Download, FileText, GraduationCap, HeartPulse, Home, Languages, Laptop, Menu, Mic,
  Moon, Play, Plus, Save, Send, Settings, ShieldCheck, Sparkles, Sun, Volume2, X,
  Zap, Contrast, Type, Upload, RotateCcw, ClipboardCheck
} from "lucide-react";

type QuizQuestion = { question: string; options: string[]; answer: number; explanation: string };
type Resource = { id: string; title: string; content: string; savedAt: string };
type ResumeData = { name: string; email: string; phone: string; role: string; skills: string; education: string; experience: string };
type Prefs = { language: "en" | "ta"; largeText: boolean; highContrast: boolean; darkMode: boolean; simpleLanguage: boolean; lowData: boolean };

const defaultPrefs: Prefs = { language: "en", largeText: false, highContrast: false, darkMode: false, simpleLanguage: true, lowData: false };
const starterText = "Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to make their food. Chlorophyll in leaves captures light energy. Oxygen is released during this process. Photosynthesis supports most life on Earth because it creates food and releases oxygen.";

function readStore<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function makeQuestions(text: string): QuizQuestion[] {
  const topic = text.trim().split(/[.!?\n]/).filter(Boolean)[0]?.slice(0, 90) || "the topic";
  return [
    { question: `What is the main topic of these notes?`, options: [topic, "A sports competition", "A cooking recipe", "A travel plan"], answer: 0, explanation: "The first statement in your notes introduces the main topic." },
    { question: "What is the best first step when studying a new concept?", options: ["Memorise every word immediately", "Identify the main idea", "Skip the examples", "Avoid asking questions"], answer: 1, explanation: "Finding the main idea helps you understand the details." },
    { question: "Which action helps you check your understanding?", options: ["Close the notes without review", "Read only the title", "Answer practice questions", "Ignore difficult words"], answer: 2, explanation: "Practice questions help you check what you understand." },
    { question: "What should you do when a sentence is difficult?", options: ["Give up", "Break it into smaller parts", "Skip the whole lesson", "Copy it without reading"], answer: 1, explanation: "Smaller parts are easier to understand." },
    { question: "What is a useful revision method?", options: ["Review key points and test yourself", "Study only once", "Avoid summaries", "Never take breaks"], answer: 0, explanation: "Reviewing key points and self-testing can support learning." }
  ];
}
function makeExplanation(text: string, language: "en" | "ta", simple: boolean): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (language === "ta") {
    return `எளிய விளக்கம் (Demo):\n\n${cleaned ? cleaned : "முதலில் உங்கள் குறிப்புகளை உள்ளிடவும்."}\n\nமுக்கிய கருத்து: குறிப்புகளில் உள்ள முக்கியமான கருத்தை கண்டறிந்து, அதை உங்கள் சொற்களில் விளக்க முயற்சிக்கவும்.\n\nகுறிப்பு: இது உள்ளூரில் உருவாக்கப்படும் மாதிரி விளக்கம். உண்மையான AI மொழிபெயர்ப்பு அல்லது விளக்கத்திற்கு AI backend இணைக்கப்பட வேண்டும்.`;
  }
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (!cleaned) return "Enter or upload your study notes to get a simplified explanation.";
  if (!simple) return `Summary (local demo):\n\n${sentences.slice(0, 5).join(" ")}`;
  return `Simple explanation (local demo):\n\n${sentences.slice(0, 3).join(" ")}\n\nKey idea: Read each sentence slowly. Identify the main idea, then explain it in your own words.\n\nNote: This is a basic local demonstration, not a live AI-generated explanation. Connect a backend AI service for intelligent summarisation.`;
}
function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function App() {
  const [active, setActive] = useState("home");
  const [prefs, setPrefs] = useState<Prefs>(() => readStore("ab-prefs", defaultPrefs));
  const [resources, setResources] = useState<Resource[]>(() => readStore("ab-resources", []));
  const [sessions, setSessions] = useState<number>(() => readStore("ab-sessions", 0));
  const [resumeCount, setResumeCount] = useState<number>(() => readStore("ab-resumes", 0));
  const [digitalCount, setDigitalCount] = useState<number>(() => readStore("ab-digital", 0));
  const [notes, setNotes] = useState(starterText);
  const [explanation, setExplanation] = useState("");
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [voiceReply, setVoiceReply] = useState("");
  const [resume, setResume] = useState<ResumeData>({ name: "", email: "", phone: "", role: "", skills: "", education: "", experience: "" });
  const [reminder, setReminder] = useState({ title: "", date: "" });
  const [reminders, setReminders] = useState<{ title: string; date: string }[]>(() => readStore("ab-reminders", []));
  const [healthQuery, setHealthQuery] = useState("");
  const [digitalTopic, setDigitalTopic] = useState("Using an online application");
  const [mobileMenu, setMobileMenu] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem("ab-prefs", JSON.stringify(prefs)); }, [prefs]);
  useEffect(() => { localStorage.setItem("ab-resources", JSON.stringify(resources)); }, [resources]);
  useEffect(() => { localStorage.setItem("ab-sessions", String(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem("ab-resumes", String(resumeCount)); }, [resumeCount]);
  useEffect(() => { localStorage.setItem("ab-digital", String(digitalCount)); }, [digitalCount]);
  useEffect(() => { localStorage.setItem("ab-reminders", JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.darkMode ? "dark" : "light";
    document.documentElement.dataset.contrast = prefs.highContrast ? "high" : "normal";
    document.documentElement.classList.toggle("large-text", prefs.largeText);
  }, [prefs]);

  const navItems = useMemo(() => [
    { id: "home", label: "Overview", icon: Home },
    { id: "learn", label: "Learning assistant", icon: GraduationCap },
    { id: "health", label: "Healthcare", icon: HeartPulse },
    { id: "career", label: "Employment", icon: BriefcaseBusiness },
    { id: "digital", label: "Digital skills", icon: Laptop },
    { id: "voice", label: "Voice assistant", icon: Mic },
    { id: "saved", label: "Saved resources", icon: BookOpen },
    { id: "settings", label: "Accessibility settings", icon: Accessibility }
  ], []);

  const updatePref = (key: keyof Prefs, value: boolean | "en" | "ta") => setPrefs(p => ({ ...p, [key]: value } as Prefs));
  const go = (id: string) => { setActive(id); setMobileMenu(false); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); };

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const allowed = [".txt", ".md", ".csv"];
    if (!allowed.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setNotice("For this prototype, upload a .txt, .md, or .csv file. PDF and DOCX extraction is not configured."); e.target.value = ""; return;
    }
    if (file.size > 1_000_000) { setNotice("File is too large. Please choose a file smaller than 1 MB."); e.target.value = ""; return; }
    try { setNotes(await file.text()); setNotice(`Loaded ${file.name}`); }
    catch { setNotice("Could not read this file. Please try a plain-text file."); }
    e.target.value = "";
  }

  async function generateLesson(e?: FormEvent) {
    e?.preventDefault();
    if (!notes.trim()) { setNotice("Add some study notes before generating a lesson."); return; }
    setBusy(true); setNotice("");
    try {
      const endpoint = import.meta.env.VITE_AI_API_URL as string | undefined;
      if (endpoint) {
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: notes, language: prefs.language, simpleLanguage: prefs.simpleLanguage }) });
        if (!response.ok) throw new Error("AI service request failed");
        const data = await response.json();
        setExplanation(String(data.explanation || "The AI service returned no explanation."));
        setQuiz(Array.isArray(data.quiz) ? data.quiz : makeQuestions(notes));
      } else {
        setExplanation(makeExplanation(notes, prefs.language, prefs.simpleLanguage));
        setQuiz(makeQuestions(notes));
        setNotice("Local demo mode: summary and quiz use a basic fallback. Configure a secure AI backend for real AI-generated content.");
      }
      setAnswers({}); setQuizScore(null); setSessions(n => n + 1);
    } catch {
      setExplanation(makeExplanation(notes, prefs.language, prefs.simpleLanguage));
      setQuiz(makeQuestions(notes)); setAnswers({}); setQuizScore(null); setSessions(n => n + 1);
      setNotice("AI service unavailable. Showing a clearly labelled local demo fallback instead.");
    } finally { setBusy(false); }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setNotice("Text-to-speech is not supported in this browser."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = prefs.language === "ta" ? "ta-IN" : "en-IN";
    utterance.rate = 0.9; window.speechSynthesis.speak(utterance);
  }
  function voiceCommand(command: string) {
    const c = command.toLowerCase();
    if (c.includes("bigger") || c.includes("large text")) { updatePref("largeText", true); setVoiceReply("Large text is now enabled."); return; }
    if (c.includes("high contrast")) { updatePref("highContrast", true); setVoiceReply("High-contrast mode is now enabled."); return; }
    if (c.includes("dark mode")) { updatePref("darkMode", true); setVoiceReply("Dark mode is now enabled."); return; }
    if (c.includes("tamil")) { updatePref("language", "ta"); setVoiceReply("Tamil is selected. Note: interface translations are partial in this prototype."); return; }
    if (c.includes("read") || c.includes("speak") || c.includes("aloud")) { const text = explanation || notes; speak(text); setVoiceReply("Reading the current learning material aloud."); return; }
    if (c.includes("lesson") || c.includes("notes") || c.includes("explain")) { go("learn"); setVoiceReply("Opening the Learning Assistant. Add your notes and select Generate lesson."); return; }
    if (c.includes("resume") || c.includes("job")) { go("career"); setVoiceReply("Opening the Resume Builder."); return; }
    if (c.includes("hospital") || c.includes("health")) { go("health"); setVoiceReply("Opening Healthcare. Enter a location or health topic to continue."); return; }
    if (c.includes("digital") || c.includes("application")) { go("digital"); setVoiceReply("Opening Digital Skills."); return; }
    setVoiceReply("I could not match that command. Try: make text bigger, enable high contrast, read my notes aloud, open resume builder, or find healthcare information.");
  }
  function startListening() {
    const SpeechRecognitionCtor = (window as Window & { SpeechRecognition?: new () => { lang: string; onresult: (event: { results: { transcript: string }[][] }) => void; onerror: () => void; onend: () => void; start: () => void } ; webkitSpeechRecognition?: new () => { lang: string; onresult: (event: { results: { transcript: string }[][] }) => void; onerror: () => void; onend: () => void; start: () => void } }).SpeechRecognition
      || (window as Window & { webkitSpeechRecognition?: new () => { lang: string; onresult: (event: { results: { transcript: string }[][] }) => void; onerror: () => void; onend: () => void; start: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) { setVoiceReply("Speech recognition is unavailable in this browser. Type your command below instead."); return; }
    const recognition = new SpeechRecognitionCtor(); recognition.lang = prefs.language === "ta" ? "ta-IN" : "en-IN";
    recognition.onresult = event => { const command = event.results[0][0].transcript; setVoiceText(command); voiceCommand(command); };
    recognition.onerror = () => setVoiceReply("Microphone input failed. Check browser permission or type a command.");
    recognition.start();
  }

  function saveResource(title: string, content: string) {
    const item: Resource = { id: crypto.randomUUID(), title, content, savedAt: new Date().toLocaleString() };
    setResources(r => [item, ...r]); setNotice("Resource saved on this device.");
  }
  function createResume(e: FormEvent) {
    e.preventDefault();
    if (!resume.name.trim() || !resume.role.trim()) { setNotice("Please enter your name and target role."); return; }
    const content = `${resume.name}\n${resume.email} | ${resume.phone}\n\nPROFESSIONAL SUMMARY\nAspiring ${resume.role} seeking an opportunity to apply skills and continue learning.\n\nSKILLS\n${resume.skills || "Add your skills"}\n\nEDUCATION\n${resume.education || "Add your education"}\n\nEXPERIENCE / PROJECTS\n${resume.experience || "Add projects, experience, volunteering, or practical work"}\n`;
    downloadText(`${resume.name.trim().replace(/\s+/g, "-").toLowerCase()}-resume.txt`, content);
    setResumeCount(n => n + 1); setNotice("Resume downloaded as a text file. You can open it in Word and export as PDF.");
  }
  function addReminder(e: FormEvent) {
    e.preventDefault(); if (!reminder.title.trim() || !reminder.date) { setNotice("Enter a reminder title and date."); return; }
    setReminders(r => [...r, reminder]); setReminder({ title: "", date: "" }); setNotice("Reminder saved on this device.");
  }
  function handleQuizSubmit() {
    if (Object.keys(answers).length < quiz.length) { setNotice("Please answer every question before checking your score."); return; }
    setQuizScore(quiz.reduce((score, q, i) => score + (answers[i] === q.answer ? 1 : 0), 0));
  }
  function digitalLesson() {
    setDigitalCount(n => n + 1);
    setNotice(`Lesson opened: ${digitalTopic}. Your completion is recorded locally on this device.`);
  }

  const activeLabel = navItems.find(n => n.id === active)?.label || "Overview";
  return (
    <div className={`app-shell ${prefs.lowData ? "low-data" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`} aria-label="Main navigation">
        <div className="brand">
          <div className="brand-mark"><Accessibility size={24} aria-hidden="true" /></div>
          <div><strong>AccessBridge <span>AI</span></strong><small>Inclusive by design</small></div>
          <button className="icon-button mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X size={20}/></button>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navItems.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => go(item.id)} aria-current={active === item.id ? "page" : undefined}>
              <Icon size={19} aria-hidden="true"/><span>{item.label}</span>{item.id === "saved" && resources.length > 0 && <em>{resources.length}</em>}
            </button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card"><div className="support-icon"><ShieldCheck size={18}/></div><strong>Your needs, your settings</strong><p>Choose the features that work best for you.</p><button onClick={() => go("settings")}>Personalise access <span>→</span></button></div>
          <div className="sidebar-foot"><span className="status-dot"></span> Prototype running locally</div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-backdrop" onClick={() => setMobileMenu(false)} aria-label="Close menu backdrop" />}
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open navigation"><Menu size={21}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{activeLabel}</strong></div></div>
          <div className="top-actions">
            <label className="language-select"><Languages size={16}/><select aria-label="Language" value={prefs.language} onChange={e => updatePref("language", e.target.value as "en" | "ta")}><option value="en">English</option><option value="ta">தமிழ்</option></select><ChevronDown size={14}/></label>
            <button className="icon-button" onClick={() => updatePref("darkMode", !prefs.darkMode)} aria-label={prefs.darkMode ? "Enable light mode" : "Enable dark mode"}>{prefs.darkMode ? <Sun size={19}/> : <Moon size={19}/>}</button>
            <button className="avatar" onClick={() => go("settings")} aria-label="Open accessibility settings">A</button>
          </div>
        </header>

        <main id="main-content" className="page-content">
          {notice && <div className="notice" role="status"><CircleHelp size={17}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={16}/></button></div>}

          {active === "home" && <>
            <section className="hero">
              <div className="hero-copy"><div className="eyebrow"><Sparkles size={15}/> ACCESS FOR EVERYONE</div><h1>Technology for everyone.<br/><span>Opportunities without barriers.</span></h1><p>One inclusive space to learn, find helpful services, build your career, and gain digital confidence — at your own pace.</p><div className="hero-actions"><button className="btn btn-primary" onClick={() => go("learn")}>Start learning <span>→</span></button><button className="btn btn-outline" onClick={() => go("settings")}><Accessibility size={17}/> Personalise access</button></div><div className="hero-note"><ShieldCheck size={15}/> Your preferences are saved on this device.</div></div>
              <div className="hero-visual" aria-hidden="true"><div className="orb orb-one"></div><div className="orb orb-two"></div><div className="visual-card visual-card-main"><div className="visual-top"><div className="mini-logo"><Zap size={18}/></div><span>Access for all</span><span className="live-dot"></span></div><div className="visual-title">Every ability.<br/>Every possibility.</div><div className="visual-bars"><i></i><i></i><i></i></div><div className="visual-bottom"><span><BookOpen size={16}/> Learn</span><span><HeartPulse size={16}/> Care</span><span><BriefcaseBusiness size={16}/> Grow</span></div></div><div className="floating-pill pill-top"><span className="pill-icon violet"><Volume2 size={17}/></span><span><strong>Listen & learn</strong><small>Audio enabled</small></span><Check size={17} className="check-green"/></div><div className="floating-pill pill-bottom"><span className="pill-icon blue"><Languages size={17}/></span><span><strong>தமிழ் + English</strong><small>Language choices</small></span></div></div>
            </section>
            <section className="stats-grid" aria-label="Your activity">
              <Stat icon={<BookOpen/>} label="Saved resources" value={resources.length} tone="purple"/>
              <Stat icon={<GraduationCap/>} label="Learning sessions" value={sessions} tone="blue"/>
              <Stat icon={<BriefcaseBusiness/>} label="Resumes created" value={resumeCount} tone="orange"/>
              <Stat icon={<Laptop/>} label="Digital lessons" value={digitalCount} tone="green"/>
            </section>
            <section className="section-block"><div className="section-heading"><div><div className="eyebrow muted">YOUR ACCESS HUB</div><h2>What would you like to do?</h2><p>Choose a service to get started. You can change accessibility settings anytime.</p></div><button className="text-link" onClick={() => go("settings")}>Accessibility settings <span>→</span></button></div>
              <div className="service-grid">
                <ServiceCard icon={<GraduationCap/>} tone="purple" title="AI Learning Assistant" desc="Understand notes, create summaries, and practise with quizzes." tags={["Simple explanations","Text-to-speech"]} onClick={() => go("learn")} action="Explore learning"/>
                <ServiceCard icon={<HeartPulse/>} tone="rose" title="Healthcare Assistant" desc="Explore general health information and prepare for appointments." tags={["Plain language","Reminders"]} onClick={() => go("health")} action="Explore healthcare"/>
                <ServiceCard icon={<BriefcaseBusiness/>} tone="blue" title="Employment Assistant" desc="Build a resume and prepare for your next opportunity." tags={["Resume builder","Interview practice"]} onClick={() => go("career")} action="Build your resume"/>
                <ServiceCard icon={<Laptop/>} tone="green" title="Digital Inclusion" desc="Learn online tasks through clear, step-by-step guides." tags={["Beginner friendly","Tamil + English"]} onClick={() => go("digital")} action="Learn digital skills"/>
              </div>
            </section>
            <section className="bottom-grid"><div className="panel voice-panel"><div className="panel-icon purple-bg"><Mic size={20}/></div><div className="panel-content"><div className="eyebrow muted">HANDS-FREE HELP</div><h3>One voice, many services</h3><p>Use voice or type a command to navigate the platform.</p><button className="btn btn-primary btn-small" onClick={() => go("voice")}>Try voice assistant <span>→</span></button></div><div className="voice-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
              <div className="panel saved-panel"><div className="panel-icon blue-bg"><BookOpen size={20}/></div><div className="panel-content"><div className="eyebrow muted">PICK UP WHERE YOU LEFT OFF</div><h3>{resources.length ? "Your saved resources" : "Your library is ready"}</h3><p>{resources.length ? `${resources.length} resource${resources.length === 1 ? "" : "s"} saved on this device.` : "Save lessons and guides to find them here later."}</p><button className="text-link" onClick={() => go("saved")}>Open saved resources <span>→</span></button></div></div></section>
            <div className="demo-disclaimer"><ShieldCheck size={17}/><p><strong>Prototype transparency:</strong> Your activity counts are stored locally on this device. AI summaries and quizzes use a basic demo fallback unless you configure a real backend AI service.</p></div>
          </>}

          {active === "learn" && <section className="module-page"><ModuleHeader icon={<GraduationCap/>} eyebrow="LEARN AT YOUR OWN PACE" title="AI Learning Assistant" description="Turn your notes into easier explanations and practice questions. Your text stays in this browser unless you connect an AI backend." tone="purple"/>
            <div className="two-col"><form className="panel form-panel" onSubmit={generateLesson}><div className="panel-title-row"><h3>Your study notes</h3><span className="tag">Text / TXT / MD / CSV</span></div><p className="helper-text">Paste your notes or upload a small text-based file (up to 1 MB).</p><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={10} aria-label="Study notes" placeholder="Paste your study notes here..."/><div className="form-tools"><input ref={fileRef} type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" onChange={handleFile} hidden/><button type="button" className="btn btn-outline btn-small" onClick={() => fileRef.current?.click()}><Upload size={16}/> Upload notes</button><span>{notes.length.toLocaleString()} characters</span></div><div className="inline-options"><label className="check-label"><input type="checkbox" checked={prefs.simpleLanguage} onChange={e => updatePref("simpleLanguage", e.target.checked)}/> Use simple language</label><label className="field-label">Language<select value={prefs.language} onChange={e => updatePref("language", e.target.value as "en" | "ta")}><option value="en">English</option><option value="ta">Tamil</option></select></label></div><button className="btn btn-primary full-width" disabled={busy} type="submit">{busy ? <><span className="spinner"></span> Preparing lesson…</> : <><Sparkles size={17}/> Generate lesson & quiz</>}</button></form>
              <div className="panel output-panel"><div className="panel-title-row"><h3><Sparkles size={18}/> Simplified explanation</h3>{explanation && <button className="icon-button" onClick={() => speak(explanation)} aria-label="Read explanation aloud"><Volume2 size={18}/></button>}</div>{explanation ? <><div className="explanation-text">{explanation}</div><div className="output-actions"><button className="btn btn-outline btn-small" onClick={() => speak(explanation)}><Volume2 size={16}/> Listen</button><button className="btn btn-outline btn-small" onClick={() => saveResource("Learning summary", explanation)}><Save size={16}/> Save summary</button><button className="btn btn-outline btn-small" onClick={() => downloadText("accessbridge-summary.txt", explanation)}><Download size={16}/> Download</button></div></> : <div className="empty-state"><div className="empty-illustration"><BookOpen size={29}/></div><strong>Your explanation will appear here</strong><p>Add notes and choose “Generate lesson & quiz”.</p></div>}</div></div>
            {quiz.length > 0 && <div className="panel quiz-panel"><div className="panel-title-row"><div><div className="eyebrow muted">QUICK KNOWLEDGE CHECK</div><h3>Practice quiz <span className="tag">{quiz.length} questions</span></h3></div><ClipboardCheck size={22}/></div>{quiz.map((q, i) => <fieldset className="quiz-question" key={i}><legend><strong>{i + 1}.</strong> {q.question}</legend>{q.options.map((option, j) => <label className={`quiz-option ${quizScore !== null && j === q.answer ? "correct-option" : ""}`} key={j}><input type="radio" name={`q-${i}`} checked={answers[i] === j} onChange={() => { setAnswers(a => ({ ...a, [i]: j })); setQuizScore(null); }}/><span>{option}</span>{quizScore !== null && j === q.answer && <Check size={16}/>}</label>)}{quizScore !== null && <p className="quiz-explanation">{q.explanation}</p>}</fieldset>)}<div className="quiz-footer"><button className="btn btn-primary" onClick={handleQuizSubmit}>Check my answers</button>{quizScore !== null && <strong className="score">Score: {quizScore}/{quiz.length}</strong>}<button className="text-link" onClick={() => { setAnswers({}); setQuizScore(null); }}>Reset quiz</button></div></div>}
          </section>}

          {active === "health" && <section className="module-page"><ModuleHeader icon={<HeartPulse/>} eyebrow="INFORMATION YOU CAN UNDERSTAND" title="Healthcare Assistant" description="Prepare for appointments and explore general health information in plain language." tone="rose"/><div className="health-warning"><ShieldCheck size={20}/><div><strong>Important health notice</strong><p>This prototype provides general information only. It cannot diagnose conditions or replace a qualified health professional. For a medical emergency in India, call 112.</p></div></div><div className="two-col"><div className="panel form-panel"><h3>Understand a health topic</h3><p className="helper-text">Enter a general topic to get a safe appointment-preparation guide.</p><form onSubmit={e => { e.preventDefault(); if (!healthQuery.trim()) { setNotice("Enter a health topic first."); return; } setVoiceReply(`Appointment preparation for: ${healthQuery}. Write down your symptoms, when they started, current medicines, allergies, and questions. A qualified clinician can give advice for your situation.`); }}><label className="field-label stacked">Topic or question<input value={healthQuery} onChange={e => setHealthQuery(e.target.value)} placeholder="e.g. preparing for a blood test"/></label><button className="btn btn-primary full-width" type="submit">Create preparation checklist</button></form>{voiceReply && active === "health" && <div className="info-result"><h4>Preparation checklist</h4><p>{voiceReply}</p><button className="btn btn-outline btn-small" onClick={() => saveResource("Health appointment checklist", voiceReply)}><Save size={15}/> Save checklist</button></div>}</div><div className="panel form-panel"><h3>Medication reminder</h3><p className="helper-text">Create a reminder to follow your existing prescription. This tool does not recommend or change medication doses.</p><form onSubmit={addReminder}><label className="field-label stacked">Reminder title<input value={reminder.title} onChange={e => setReminder(r => ({ ...r, title: e.target.value }))} placeholder="e.g. Take prescribed medicine"/></label><label className="field-label stacked">Date and time<input type="datetime-local" value={reminder.date} onChange={e => setReminder(r => ({ ...r, date: e.target.value }))}/></label><button className="btn btn-outline full-width" type="submit"><Plus size={16}/> Save reminder</button></form>{reminders.length > 0 && <div className="reminder-list"><h4>Saved reminders</h4>{reminders.map((r, i) => <div className="reminder-item" key={i}><Activity size={16}/><span><strong>{r.title}</strong><small>{new Date(r.date).toLocaleString()}</small></span><button className="icon-button" onClick={() => setReminders(rs => rs.filter((_, index) => index !== i))} aria-label={`Delete reminder ${r.title}`}><X size={15}/></button></div>)}</div>}</div></div><div className="panel resource-callout"><div className="panel-icon rose-bg"><HeartPulse size={20}/></div><div><h3>Find verified healthcare services</h3><p>Use official public-health resources or your local health department to confirm current facilities, availability, and services.</p><a className="btn btn-outline btn-small" href="https://ors.gov.in/" target="_blank" rel="noreferrer">Open Government hospital services <span>↗</span></a></div></div></section>}

          {active === "career" && <section className="module-page"><ModuleHeader icon={<BriefcaseBusiness/>} eyebrow="YOUR SKILLS HAVE VALUE" title="Employment Assistant" description="Create a clear resume and practise talking about your skills, projects, and experience." tone="blue"/><div className="two-col"><form className="panel form-panel" onSubmit={createResume}><div className="panel-title-row"><h3>Resume builder</h3><span className="tag">Simple form</span></div><p className="helper-text">Enter what you are comfortable sharing. Required fields are marked with an asterisk.</p><label className="field-label stacked">Full name *<input required value={resume.name} onChange={e => setResume(r => ({ ...r, name: e.target.value }))} placeholder="Your name"/></label><div className="form-row"><label className="field-label stacked">Email<input type="email" value={resume.email} onChange={e => setResume(r => ({ ...r, email: e.target.value }))} placeholder="you@example.com"/></label><label className="field-label stacked">Phone<input value={resume.phone} onChange={e => setResume(r => ({ ...r, phone: e.target.value }))} placeholder="Optional"/></label></div><label className="field-label stacked">Target role *<input required value={resume.role} onChange={e => setResume(r => ({ ...r, role: e.target.value }))} placeholder="e.g. Junior web developer"/></label><label className="field-label stacked">Skills<textarea rows={3} value={resume.skills} onChange={e => setResume(r => ({ ...r, skills: e.target.value }))} placeholder="Python, teamwork, communication…"/></label><label className="field-label stacked">Education<input value={resume.education} onChange={e => setResume(r => ({ ...r, education: e.target.value }))} placeholder="Course, institution, year"/></label><label className="field-label stacked">Projects or experience<textarea rows={3} value={resume.experience} onChange={e => setResume(r => ({ ...r, experience: e.target.value }))} placeholder="Projects, volunteering, internships…"/></label><button type="submit" className="btn btn-primary full-width"><Download size={17}/> Create & download resume</button><p className="fine-print">Downloads as a text file. Open it in a word processor to format or export as PDF.</p></form><div className="panel resume-preview"><div className="panel-title-row"><h3><FileText size={18}/> Live preview</h3><span className="tag">Preview</span></div><div className="resume-paper"><h2>{resume.name || "Your Name"}</h2><p className="resume-role">{resume.role || "Your target role"}</p><p className="resume-contact">{[resume.email, resume.phone].filter(Boolean).join(" • ") || "Email • Phone"}</p><hr/><h4>PROFILE</h4><p>Aspiring {resume.role || "professional"} ready to contribute skills, learn, and solve practical problems.</p><h4>SKILLS</h4><p>{resume.skills || "Your skills will appear here."}</p><h4>EDUCATION</h4><p>{resume.education || "Your education will appear here."}</p><h4>PROJECTS & EXPERIENCE</h4><p>{resume.experience || "Your projects and experience will appear here."}</p></div><div className="interview-box"><h4><Sparkles size={17}/> Interview practice</h4><p>Try answering these questions out loud:</p><ol><li>Tell me about yourself and your interests.</li><li>Describe a problem you solved and what you learned.</li><li>Which skill are you currently improving?</li></ol><button className="btn btn-outline btn-small" onClick={() => speak("Tell me about yourself and your interests. Describe a problem you solved and what you learned. Which skill are you currently improving?")}><Volume2 size={15}/> Read questions aloud</button></div></div></div></section>}

          {active === "digital" && <section className="module-page"><ModuleHeader icon={<Laptop/>} eyebrow="BUILD DIGITAL CONFIDENCE" title="Digital Inclusion Assistant" description="Practise common online tasks with clear, beginner-friendly steps." tone="green"/><div className="two-col"><div className="panel form-panel"><h3>Choose a guided lesson</h3><label className="field-label stacked">Digital skill<select value={digitalTopic} onChange={e => setDigitalTopic(e.target.value)}><option>Using an online application</option><option>Creating a strong password</option><option>Recognising suspicious messages</option><option>Using digital payments safely</option><option>Finding an official government service</option></select></label><button className="btn btn-primary full-width" onClick={digitalLesson}><Play size={16}/> Open lesson</button><p className="fine-print">This is a practice guide, not a live government application or payment.</p></div><div className="panel output-panel"><div className="panel-title-row"><h3>Step-by-step guide</h3><span className="tag">Practice mode</span></div><ol className="step-list">{(digitalTopic.includes("password") ? ["Use a long password or passphrase that is difficult to guess.", "Do not reuse the same password across important accounts.", "Never share one-time passwords (OTPs) with anyone.", "Use a password manager if available.", "Turn on two-step verification when offered."] : digitalTopic.includes("suspicious") ? ["Pause if a message pressures you to act urgently.", "Check the sender and the full website address.", "Never share OTPs, PINs, or passwords through a message.", "Do not open unexpected attachments or links.", "Confirm requests using the organisation's official contact details."] : digitalTopic.includes("payments") ? ["Use only the official payment app from a trusted app store.", "Check the recipient name and amount before confirming.", "Never share your UPI PIN or OTP with another person.", "Remember: receiving money does not require entering your UPI PIN.", "Keep the transaction reference and report suspicious activity promptly."] : digitalTopic.includes("government") ? ["Identify the exact service you need.", "Find the official government website or portal.", "Read eligibility and document requirements before starting.", "Enter information only on the verified official site.", "Save the acknowledgement number and never share OTPs."] : ["Open the official website or application.", "Read the eligibility rules and required documents.", "Fill in each field carefully and check spelling.", "Review your details before submitting.", "Save the acknowledgement or reference number."]).map((step, i) => <li key={i}><span className="step-number">{i + 1}</span><span>{step}</span></li>)}</ol><button className="btn btn-outline btn-small" onClick={() => saveResource(digitalTopic, (document.querySelector(".step-list")?.innerText || "").trim())}><Save size={15}/> Save this guide</button></div></div></section>}

          {active === "voice" && <section className="module-page"><ModuleHeader icon={<Mic/>} eyebrow="HANDS-FREE NAVIGATION" title="One voice, many services" description="Speak a supported command or type it below. Microphone access depends on browser support and permission." tone="purple"/><div className="voice-workspace panel"><div className="voice-orb"><div className="voice-orb-inner"><Mic size={32}/></div><span className="orb-ring ring-a"></span><span className="orb-ring ring-b"></span></div><h2>How can I help you today?</h2><p>Try a command like “make the text bigger” or “help me create a resume”.</p><button className="btn btn-primary mic-button" onClick={startListening}><Mic size={18}/> Start speaking</button><form className="voice-input-row" onSubmit={e => { e.preventDefault(); if (voiceText.trim()) voiceCommand(voiceText); }}><input value={voiceText} onChange={e => setVoiceText(e.target.value)} placeholder="Type a command…" aria-label="Voice assistant command"/><button className="btn btn-primary" type="submit" aria-label="Send command"><Send size={17}/></button></form>{voiceReply && <div className="voice-response" role="status"><Sparkles size={18}/><div><strong>AccessBridge response</strong><p>{voiceReply}</p><button className="text-link" onClick={() => speak(voiceReply)}>Read response aloud <Volume2 size={14}/></button></div></div>}<div className="suggested-commands"><h3>Try saying</h3><div className="command-chips">{["Make the text bigger","Enable high contrast","Read my notes aloud","Explain this lesson in Tamil","Help me create a resume","Find a nearby hospital"].map(cmd => <button key={cmd} onClick={() => { setVoiceText(cmd); voiceCommand(cmd); }}>{cmd}</button>)}</div></div></div><div className="demo-disclaimer"><CircleHelp size={17}/><p>Voice navigation is command-based in this prototype. Browser speech recognition may not be available on all devices. Typing remains available as an alternative.</p></div></section>}

          {active === "saved" && <section className="module-page"><ModuleHeader icon={<BookOpen/>} eyebrow="YOUR PERSONAL LIBRARY" title="Saved resources" description="Resources are stored in this browser on this device. Clearing browser storage may remove them." tone="blue"/>{resources.length === 0 ? <div className="panel empty-library"><div className="empty-illustration"><BookOpen size={28}/></div><h3>No saved resources yet</h3><p>Save a lesson summary or digital guide to find it here.</p><button className="btn btn-primary" onClick={() => go("learn")}>Go to learning assistant</button></div> : <div className="saved-list">{resources.map(r => <article className="panel saved-resource" key={r.id}><div className="panel-icon blue-bg"><FileText size={19}/></div><div className="saved-resource-body"><div className="saved-meta">{r.savedAt}</div><h3>{r.title}</h3><p>{r.content.slice(0, 260)}{r.content.length > 260 ? "…" : ""}</p><div className="saved-actions"><button className="btn btn-outline btn-small" onClick={() => downloadText(`${r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`, r.content)}><Download size={15}/> Download</button><button className="btn btn-outline btn-small" onClick={() => speak(r.content)}><Volume2 size={15}/> Listen</button><button className="text-link danger-link" onClick={() => setResources(rs => rs.filter(item => item.id !== r.id))}>Delete</button></div></div></article>)}</div>}</section>}

          {active === "settings" && <section className="module-page"><ModuleHeader icon={<Accessibility/>} eyebrow="MAKE THIS SPACE YOURS" title="Accessibility settings" description="Choose the options that work for you. These preferences are stored locally and can be changed anytime." tone="purple"/><div className="settings-layout"><div className="panel settings-panel"><h3><Accessibility size={19}/> Display & readability</h3><SettingRow icon={<Type/>} title="Larger text" desc="Increase text size across the website." checked={prefs.largeText} onChange={v => updatePref("largeText", v)}/><SettingRow icon={<Contrast/>} title="High-contrast mode" desc="Increase contrast between text and backgrounds." checked={prefs.highContrast} onChange={v => updatePref("highContrast", v)}/><SettingRow icon={prefs.darkMode ? <Sun/> : <Moon/>} title="Dark mode" desc="Use a darker interface in low-light settings." checked={prefs.darkMode} onChange={v => updatePref("darkMode", v)}/><SettingRow icon={<Languages/>} title="Simple-language mode" desc="Prefer clearer, less complex explanations." checked={prefs.simpleLanguage} onChange={v => updatePref("simpleLanguage", v)}/></div><div className="panel settings-panel"><h3><Settings size={19}/> Language & connection</h3><label className="field-label stacked">Preferred language<select value={prefs.language} onChange={e => updatePref("language", e.target.value as "en" | "ta")}><option value="en">English</option><option value="ta">Tamil (தமிழ்)</option></select></label><SettingRow icon={<Zap/>} title="Low-data mode" desc="Reduce decorative effects and avoid unnecessary loading." checked={prefs.lowData} onChange={v => updatePref("lowData", v)}/><div className="setting-info"><ShieldCheck size={18}/><p>These settings do not require a disability diagnosis. Choose what makes the site easier for you to use.</p></div><button className="btn btn-outline full-width" onClick={() => { setPrefs(defaultPrefs); setNotice("Accessibility settings restored to defaults."); }}><RotateCcw size={16}/> Reset preferences</button></div></div><div className="panel data-panel"><div><h3>Local data and privacy</h3><p>Saved resources, reminders, and activity counts are kept in this browser's local storage. They are not synced to an account.</p></div><button className="btn btn-outline btn-small" onClick={() => { if (window.confirm("Delete saved resources, reminders, and activity counts from this browser?")) { setResources([]); setReminders([]); setSessions(0); setResumeCount(0); setDigitalCount(0); setNotice("Local activity data has been cleared."); } }}>Clear local data</button></div></section>}

          <footer className="page-footer"><div className="footer-brand"><div className="brand-mark small-mark"><Accessibility size={17}/></div><strong>AccessBridge AI</strong></div><span>Designed for access. Built for possibility.</span><span className="footer-version">Prototype v1.0</span></footer>
        </main>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}-bg`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>On this device</small></div></div>;
}
function ServiceCard({ icon, tone, title, desc, tags, onClick, action }: { icon: React.ReactNode; tone: string; title: string; desc: string; tags: string[]; onClick: () => void; action: string }) {
  return <article className="service-card"><div className={`service-icon ${tone}-bg`}>{icon}</div><h3>{title}</h3><p>{desc}</p><div className="service-tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div><button onClick={onClick} className="service-action">{action}<span>→</span></button></article>;
}
function ModuleHeader({ icon, eyebrow, title, description, tone }: { icon: React.ReactNode; eyebrow: string; title: string; description: string; tone: string }) {
  return <div className="module-header"><div className={`module-icon ${tone}-bg`}>{icon}</div><div><div className="eyebrow muted">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div></div>;
}
function SettingRow({ icon, title, desc, checked, onChange }: { icon: React.ReactNode; title: string; desc: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="setting-row"><div className="setting-icon">{icon}</div><div className="setting-copy"><strong>{title}</strong><p>{desc}</p></div><label className="switch"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} aria-label={title}/><span className="switch-track"></span></label></div>;
}
export default App;