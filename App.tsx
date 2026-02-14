
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  FileText, 
  ShieldCheck, 
  Globe, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  X,
  Settings,
  Download,
  Trash2,
  ChevronLeft,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Plus,
  Phone,
  User,
  ShieldAlert,
  Search,
  Camera,
  Filter,
  ArrowRight,
  Share2,
  Image as ImageIcon,
  CreditCard,
  Copy
} from 'lucide-react';
import { Language, RegistrationData, Player, Message } from './types';
import { getTournamentAssistance } from './geminiService';

const STORAGE_KEY = 'lohar_wadha_registrations_v3';
const ADMIN_PASSWORD = 'admin123';
const EASY_PAISA_NUMBER = '03272587785';
const EASY_PAISA_NAME = 'Haris Mubarak';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ur');
  const [step, setStep] = useState<'welcome' | 'form' | 'success' | 'admin'>('welcome');
  const [formStep, setFormStep] = useState(1); // 1: Team, 2: Contacts, 3: Players, 4: Payment Info
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  
  // Admin Search/Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'jamaati' | 'non-jamaati'>('all');
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);

  const [editingRegId, setEditingRegId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<RegistrationData, 'regId' | 'timestamp'>>({
    teamName: '',
    captainName: '',
    captainContact: '',
    viceCaptainName: '',
    viceCaptainContact: '',
    alternativeContact: '',
    players: Array.from({ length: 11 }, (_, i) => ({ id: i + 1, name: '' })),
    teamType: 'non-jamaati',
    agreedToTerms: false
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRegistrations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load registrations", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  }, [registrations]);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'ur' : 'en');

  const handlePlayerChange = (id: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, name } : p)
    }));
  };

  const resetForm = () => {
    setFormData({
      teamName: '',
      captainName: '',
      captainContact: '',
      viceCaptainName: '',
      viceCaptainContact: '',
      alternativeContact: '',
      players: Array.from({ length: 11 }, (_, i) => ({ id: i + 1, name: '' })),
      teamType: 'non-jamaati',
      agreedToTerms: false
    });
    setEditingRegId(null);
    setFormStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRegId) {
      setRegistrations(prev => prev.map(reg => 
        reg.regId === editingRegId 
          ? { ...reg, ...formData, timestamp: new Date().toISOString() } 
          : reg
      ));
      if (adminAuth) setStep('admin');
      else setStep('success');
    } else {
      const newReg: RegistrationData = {
        ...formData,
        regId: `LW-${Math.floor(Math.random() * 90000) + 10000}`,
        timestamp: new Date().toISOString()
      };
      setRegistrations(prev => [newReg, ...prev]);
      if (adminAuth && step === 'form') setStep('admin');
      else setStep('success');
    }
    resetForm();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(lang === 'ur' ? 'کاپی ہو گیا!' : 'Copied to clipboard!');
  };

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setAdminAuth(true);
      setStep('admin');
      setIsLoginModalOpen(false);
      setAdminPasswordInput('');
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const startEdit = (reg: RegistrationData) => {
    setFormData({
      teamName: reg.teamName,
      captainName: reg.captainName,
      captainContact: reg.captainContact,
      viceCaptainName: reg.viceCaptainName,
      viceCaptainContact: reg.viceCaptainContact,
      alternativeContact: reg.alternativeContact,
      players: reg.players,
      teamType: reg.teamType,
      agreedToTerms: reg.agreedToTerms
    });
    setEditingRegId(reg.regId);
    setStep('form');
  };

  const exportToCSV = () => {
    if (registrations.length === 0) return;
    const headers = ['Reg ID', 'Date', 'Team', 'Type', 'Captain', 'Capt Contact', 'Vice Captain', 'Vice Contact', 'Alt Contact'];
    const rows = registrations.map(reg => [reg.regId, new Date(reg.timestamp).toLocaleDateString(), reg.teamName, reg.teamType, reg.captainName, reg.captainContact, reg.viceCaptainName, reg.viceCaptainContact, reg.alternativeContact]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tournament_teams_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const deleteRegistration = (id: string) => {
    if (window.confirm(lang === 'ur' ? 'کیا آپ حذف کرنا چاہتے ہیں؟' : 'Delete registration?')) {
      setRegistrations(prev => prev.filter(r => r.regId !== id));
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.teamName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      reg.captainName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      reg.regId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || reg.teamType === filterType;
    return matchesSearch && matchesType;
  });

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: Message = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);
    const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const response = await getTournamentAssistance(chatInput, history);
    setMessages(prev => [...prev, { role: 'model', text: response || '' }]);
    setIsThinking(false);
  };

  const content = {
    en: {
      title: "Lohar Wadha Tournament",
      subtitle: "Official Registration Portal",
      announcement: "Registration for the upcoming Lohar Wadha Tournament is now open for all teams.",
      step1: "Team Basics", step2: "Leadership", step3: "Squad", step4: "Payment Info",
      teamName: "Team Name", captainName: "Captain Name", captainContact: "Captain Phone",
      viceCaptainName: "Vice Captain Name", viceCaptainContact: "Vice Captain Phone",
      alternativeContact: "Emergency Contact", teamType: "Category",
      jamaati: "Jamaati", nonJamaati: "Non-Jamaati",
      player: "Player", terms: "Tournament Rules",
      submit: editingRegId ? "Update Info" : "Complete Registration",
      next: "Next Step", back: "Back", start: "Register Now",
      successTitle: "Registration Confirmed!",
      successMsg: "Your team is officially in! Please ensure the 10,000 PKR entry fee is paid via EasyPaisa to confirm your slot.",
      adminTitle: "Management Portal", totalTeams: "Total Teams",
      export: "Export CSV", noData: "No entries found.",
      loginTitle: "Management Login", loginPrompt: "Enter secure password",
      loginBtn: "Login", chatTitle: "Tournament Assistant",
      invalidPass: "Invalid Access Code", addTeam: "Manual Entry",
      editTeam: "Update Record", search: "Search teams...",
      paymentHeading: "EasyPaisa Payment",
      paymentInstruction: "Please send the 10,000 PKR entry fee to the following EasyPaisa account and keep the screenshot for verification.",
      accountNumber: "Account Number",
      accountName: "Account Name",
      rules: [
        "Tournament entry fee: 10,000 PKR per team.",
        "Entry fee must be paid before tournament starts.",
        "Committee provides professional balls & tape.",
        "Over cuts for late arrivals (Punctuality mandatory).",
        "Zero tolerance for bad conduct/disturbance.",
        "Umpire's decision is final and binding.",
        "Direct complaints to committee members only.",
        "No arguing with umpires during matches.",
        "No outsiders; only registered squad can play.",
        "Pool matches: 6 overs. Semi/Finals: 7 overs."
      ]
    },
    ur: {
      title: "لوہار وادھا ٹورنامنٹ",
      subtitle: "آفیشل رجسٹریشن پورٹل",
      announcement: "لوہار وادھا ٹورنامنٹ کے لیے ٹیموں کی رجسٹریشن کا باقاعدہ آغاز کیا جا رہا ہے۔",
      step1: "ٹیم کی تفصیل", step2: "قیادت", step3: "کھلاڑیوں کی فہرست", step4: "پیمنٹ کی تفصیل",
      teamName: "ٹیم کا نام", captainName: "کپتان کا نام", captainContact: "کپتان کا فون",
      viceCaptainName: "نائب کپتان کا نام", viceCaptainContact: "نائب کپتان کا فون",
      alternativeContact: "متبادل رابطہ", teamType: "ٹیم کی قسم",
      jamaati: "جماعتی", nonJamaati: "غیر جماعتی",
      player: "کھلاڑی", terms: "قواعد و ضوابط",
      submit: editingRegId ? "معلومات تبدیل کریں" : "رجسٹریشن مکمل کریں",
      next: "اگلا مرحلہ", back: "واپس", start: "رجسٹریشن شروع کریں",
      successTitle: "رجسٹریشن مکمل ہوگئی!",
      successMsg: "آپ کی ٹیم رجسٹر ہو چکی ہے۔ براہِ کرم یقینی بنائیں کہ انٹری فیس (10,000 روپے) ایزی پیسہ کے ذریعے ادا کر دی گئی ہے۔",
      adminTitle: "مینجمنٹ ڈیش بورڈ", totalTeams: "کل ٹیمیں",
      export: "CSV ڈاؤن لوڈ کریں", noData: "کوئی ریکارڈ نہیں ملا۔",
      loginTitle: "مینجمنٹ لاگ ان", loginPrompt: "سیکیورٹی پاس ورڈ درج کریں",
      loginBtn: "لاگ ان کریں", chatTitle: "ٹورنامنٹ اسسٹنٹ",
      invalidPass: "غلط پاس ورڈ", addTeam: "نئی ٹیم شامل کریں",
      editTeam: "معلومات اپ ڈیٹ کریں", search: "ٹیم تلاش کریں...",
      paymentHeading: "ایزی پیسہ ادائیگی",
      paymentInstruction: "براہِ کرم ٹورنامنٹ کی انٹری فیس (10,000 روپے) مندرجہ ذیل ایزی پیسہ اکاؤنٹ پر ارسال کریں اور تصدیق کے لیے اسکرین شاٹ اپنے پاس محفوظ رکھیں۔",
      accountNumber: "اکاؤنٹ نمبر",
      accountName: "اکاؤنٹ ہولڈر کا نام",
      rules: [
        "ٹورنامنٹ کی انٹری فیس 10,000 روپے فی ٹیم ہوگی۔",
        "انٹری فیس ٹورنامنٹ شروع ہونے سے پہلے جمع کروانا ضروری ہے۔",
        "ٹورنامنٹ میں بالز اور ٹیپ کمیٹی فراہم کرے گی۔",
        "وقت کی پابندی لازمی ہے؛ دیر سے آنے پر اوورز کٹیں گے۔",
        "بدمزگی پھیلانے والی ٹیم کو فوری باہر کر دیا جائے گا۔",
        "امپائر کا فیصلہ حتمی ہوگا۔",
        "شکایات کے لیے براہِ راست کمیٹی سے رابطہ کریں۔",
        "دورانِ میچ امپائر سے بحث کرنا سختی سے منع ہے۔",
        "صرف رجسٹرڈ کھلاڑی کھیل سکتے ہیں؛ باہر سے کوئی نہیں آئے گا۔",
        "پول میچ 6 اوورز؛ سیمی فائنل/فائنل 7 اوورز کے ہوں گے۔"
      ]
    }
  };

  const t = content[lang];
  const isRTL = lang === 'ur';

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'font-urdu' : 'font-sans'} bg-slate-50`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Dynamic Navbar */}
      <nav className="sticky top-0 z-50 glass shadow-md px-6 py-4 flex justify-between items-center border-b border-emerald-100">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setStep('welcome'); resetForm(); }}>
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
            <Trophy size={28} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-2xl font-black text-emerald-900 leading-tight tracking-tight">{t.title}</h1>
            <p className="text-xs text-emerald-600 font-bold opacity-75">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleLang} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-all text-sm font-bold text-slate-700 shadow-sm">
            <Globe size={18} className="text-emerald-600" />
            {lang === 'en' ? 'Urdu' : 'English'}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {step === 'welcome' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="h-64 bg-emerald-800 flex flex-col items-center justify-center relative overflow-hidden text-center px-6">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 space-y-4">
                  <div className="bg-emerald-500/20 p-4 rounded-full inline-block backdrop-blur-md">
                    <Users size={64} className="text-emerald-100" />
                  </div>
                  <h2 className="text-4xl font-black text-white drop-shadow-md">{t.subtitle}</h2>
                </div>
              </div>
              <div className="p-10 space-y-10">
                <p className="text-xl text-slate-600 text-center font-medium max-w-2xl mx-auto leading-relaxed italic">
                  "{t.announcement}"
                </p>
                
                <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 shadow-inner">
                  <h3 className="flex items-center gap-3 font-black text-amber-900 mb-8 text-2xl">
                    <ShieldAlert size={32} className="text-amber-500" />
                    {t.terms}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {t.rules.map((rule, idx) => (
                      <div key={idx} className="bg-white/70 p-4 rounded-2xl border border-amber-200 flex gap-4 items-center transform hover:scale-[1.02] transition-transform">
                        <span className="shrink-0 bg-amber-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shadow-md">
                          {idx + 1}
                        </span>
                        <p className="text-amber-900 text-sm font-bold leading-tight">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => setStep('form')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-3xl shadow-2xl hover:shadow-emerald-200/50 transition-all flex items-center justify-center gap-3 text-2xl group">
                  <FileText size={28} className="group-hover:rotate-12 transition-transform" />
                  {t.start}
                  <ArrowRight size={24} className={`${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Progress Bar */}
            <div className="flex justify-between items-center px-2 mb-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black transition-all ${
                    formStep >= num ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-300 border border-slate-200'
                  }`}>
                    {num}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold ${formStep >= num ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {t[`step${num}` as keyof typeof t]}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
              {formStep === 1 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                  <h2 className="text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                    <Trophy className="text-emerald-600" /> {t.step1}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">{t.teamName}</label>
                      <input required type="text" value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} placeholder="Lohar Tigers" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none bg-slate-50 font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">{t.teamType}</label>
                      <div className="flex gap-3 p-1.5 bg-slate-100 rounded-2xl">
                        <button type="button" onClick={() => setFormData({...formData, teamType: 'jamaati'})} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${formData.teamType === 'jamaati' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100' : 'text-slate-500'}`}>
                          {t.jamaati}
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, teamType: 'non-jamaati'})} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${formData.teamType === 'non-jamaati' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100' : 'text-slate-500'}`}>
                          {t.nonJamaati}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setFormStep(2)} className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl mt-4 flex items-center justify-center gap-2 shadow-lg">
                    {t.next} <ArrowRight className={isRTL ? 'rotate-180' : ''} />
                  </button>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                  <h2 className="text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                    <User className="text-emerald-600" /> {t.step2}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">{t.captainName}</label>
                        <input required type="text" value={formData.captainName} onChange={e => setFormData({...formData, captainName: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">{t.captainContact}</label>
                        <input required type="tel" value={formData.captainContact} onChange={e => setFormData({...formData, captainContact: e.target.value})} placeholder="03xx-xxxxxxx" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">{t.viceCaptainName}</label>
                        <input required type="text" value={formData.viceCaptainName} onChange={e => setFormData({...formData, viceCaptainName: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">{t.viceCaptainContact}</label>
                        <input required type="tel" value={formData.viceCaptainContact} onChange={e => setFormData({...formData, viceCaptainContact: e.target.value})} placeholder="03xx-xxxxxxx" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-black text-slate-700">{t.alternativeContact}</label>
                      <input required type="tel" value={formData.alternativeContact} onChange={e => setFormData({...formData, alternativeContact: e.target.value})} placeholder="Emergency Phone" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setFormStep(1)} className="flex-1 border border-slate-200 font-black py-4 rounded-2xl">{t.back}</button>
                    <button type="button" onClick={() => setFormStep(3)} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg">{t.next}</button>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                  <h2 className="text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                    <Users className="text-emerald-600" /> {t.step3}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.players.map((p) => (
                      <div key={p.id} className="relative group">
                        <div className={`absolute top-1/2 -translate-y-1/2 px-4 text-emerald-600/30 font-black italic text-lg ${isRTL ? 'right-0' : 'left-0'}`}>{p.id}</div>
                        <input required type="text" value={p.name} onChange={e => handlePlayerChange(p.id, e.target.value)} placeholder={`${t.player} ${p.id}`} className={`w-full py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setFormStep(2)} className="flex-1 border border-slate-200 font-black py-4 rounded-2xl">{t.back}</button>
                    <button type="button" onClick={() => setFormStep(4)} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg">{t.next}</button>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                  <h2 className="text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                    <CreditCard className="text-emerald-600" /> {t.step4}
                  </h2>
                  
                  <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-600 p-3 rounded-2xl text-white">
                        <Phone size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-emerald-900 text-lg">{t.paymentHeading}</h4>
                        <p className="text-sm text-emerald-600 font-medium">{t.paymentInstruction}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex justify-between items-center group">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.accountNumber}</p>
                          <p className="text-xl font-black text-slate-800 tracking-tight">{EASY_PAISA_NUMBER}</p>
                        </div>
                        <button type="button" onClick={() => copyToClipboard(EASY_PAISA_NUMBER)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                          <Copy size={20} />
                        </button>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.accountName}</p>
                          <p className="text-xl font-black text-slate-800 tracking-tight">{EASY_PAISA_NAME}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                          <User size={20} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl flex items-start gap-4 border border-slate-200">
                    <input id="agree" required type="checkbox" checked={formData.agreedToTerms} onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})} className="mt-1 w-6 h-6 text-emerald-600 rounded-lg border-slate-300 focus:ring-emerald-500 cursor-pointer" />
                    <label htmlFor="agree" className="text-sm text-slate-700 cursor-pointer font-bold leading-relaxed">{lang === 'ur' ? 'میں تصدیق کرتا ہوں کہ تمام معلومات درست ہیں اور میں فیس کی ادائیگی کا پابند ہوں۔' : 'I confirm all info is correct and I am bound to pay the entry fee.'}</label>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={() => setFormStep(3)} className="flex-1 border border-slate-200 font-black py-4 rounded-2xl">{t.back}</button>
                    <button type="submit" disabled={!formData.agreedToTerms} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                      <CheckCircle2 size={24} /> {t.submit}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="max-w-2xl mx-auto py-12 animate-in zoom-in-95 duration-700 text-center">
            {/* Wrapper for isolated print output */}
            <div id="printable-ticket-wrapper">
              {/* The Digital Pass Card */}
              <div id="printable-ticket" className="relative mb-12 transform hover:rotate-1 transition-transform cursor-pointer">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-teal-500 blur-2xl opacity-20 no-print"></div>
                <div className="relative bg-white rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border-4 border-white">
                  <div className="bg-emerald-700 text-white p-8 space-y-2 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Official Entry Pass</h4>
                        <h3 className="text-3xl font-black">{registrations[0]?.teamName}</h3>
                      </div>
                      <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
                        <Trophy size={32} />
                      </div>
                    </div>
                  </div>
                  <div className="p-8 grid grid-cols-2 gap-8 text-left border-b-2 border-dashed border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase">Category</p>
                      <p className="text-sm font-black text-slate-800">{registrations[0]?.teamType.toUpperCase()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase">Registration ID</p>
                      <p className="text-sm font-black text-emerald-600">{registrations[0]?.regId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase">Captain</p>
                      <p className="text-sm font-black text-slate-800">{registrations[0]?.captainName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase">Date Registered</p>
                      <p className="text-sm font-black text-slate-800">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-emerald-50 flex items-center gap-4 text-left">
                    <div className="bg-emerald-600 p-2 rounded-lg text-white"><CreditCard size={18} /></div>
                    <div>
                      <p className="text-[10px] text-emerald-600 font-black uppercase">Payment Status</p>
                      <p className="text-xs font-bold text-slate-700">Pending Verification (EasyPaisa)</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="w-1 h-8 bg-slate-200 rounded-full"></div>)}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lohar Wadha Youth Cup 2026</p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-4xl font-black text-slate-900 mb-6">{t.successTitle}</h2>
            <p className="text-slate-600 mb-10 text-lg leading-relaxed font-medium">
              {t.successMsg}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center no-print">
              <button onClick={() => window.print()} className="bg-white border-2 border-slate-200 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                <ImageIcon size={20} /> Screenshot / Save
              </button>
              <button onClick={() => { resetForm(); setStep('welcome'); }} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-200/50 transition-all">
                {lang === 'ur' ? 'ہوم پیج پر جائیں' : 'Return Home'}
              </button>
            </div>
          </div>
        )}

        {step === 'admin' && adminAuth && (
          <div className="animate-in fade-in duration-500 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <button onClick={() => { setStep('welcome'); resetForm(); }} className="text-emerald-600 flex items-center gap-2 text-sm font-black mb-2 hover:translate-x-[-4px] transition-all">
                  <ChevronLeft size={16} /> {t.back}
                </button>
                <h2 className="text-4xl font-black text-slate-900">{t.adminTitle}</h2>
              </div>
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <button onClick={() => { resetForm(); setStep('form'); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl">
                  <Plus size={20} /> {t.addTeam}
                </button>
                <button onClick={exportToCSV} disabled={registrations.length === 0} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50">
                  <Download size={20} /> {t.export}
                </button>
              </div>
            </div>

            {/* Admin Stats & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="bg-emerald-600 p-8 rounded-[2rem] shadow-xl text-white">
                <p className="text-emerald-100 text-sm font-black uppercase tracking-widest mb-1">{t.totalTeams}</p>
                <p className="text-5xl font-black">{registrations.length}</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col justify-center">
                <p className="text-slate-400 text-sm font-black uppercase tracking-widest mb-2">{t.teamType}</p>
                <div className="flex gap-4">
                  <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'all' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>All</button>
                  <button onClick={() => setFilterType('jamaati')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'jamaati' ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>Jamaati</button>
                  <button onClick={() => setFilterType('non-jamaati')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterType === 'non-jamaati' ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>Non-Jamaati</button>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 relative overflow-hidden group">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-100 w-24 h-24 -mr-8 group-focus-within:text-emerald-50 transition-colors" />
                <div className="relative z-10 space-y-2">
                  <label className="text-slate-400 text-sm font-black uppercase tracking-widest">{t.search}</label>
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Name / ID / Phone" className="w-full bg-transparent font-bold outline-none text-slate-800" />
                </div>
              </div>
            </div>

            {/* Management Table */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left" dir="ltr">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team / Pass</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Captain Info</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contacts</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRegistrations.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">{t.noData}</td></tr>
                    ) : (
                      filteredRegistrations.map((reg) => (
                        <tr key={reg.regId} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="text-xs font-black text-emerald-600 mb-1">{reg.regId}</div>
                            <div className="text-lg font-black text-slate-800">{reg.teamName}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{new Date(reg.timestamp).toLocaleString()}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm font-bold text-slate-800">{reg.captainName}</div>
                            <div className="text-xs text-slate-500 font-medium">{reg.captainContact}</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              reg.teamType === 'jamaati' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>{reg.teamType}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-[10px] text-slate-600 font-bold">V: {reg.viceCaptainContact}</div>
                            <div className="text-[10px] text-slate-400">A: {reg.alternativeContact}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEdit(reg)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Edit2 size={18} /></button>
                              <button onClick={() => deleteRegistration(reg.regId)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-600 p-10 text-center relative">
              <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24} /></button>
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm rotate-12">
                <Lock size={40} className="text-white" />
              </div>
              <h3 className="text-3xl font-black text-white">{t.loginTitle}</h3>
              <p className="text-emerald-100 text-sm mt-2 font-medium opacity-80">{t.loginPrompt}</p>
            </div>
            <form onSubmit={handleAdminLogin} className="p-10 space-y-6">
              <div className="relative">
                <input autoFocus type={showPassword ? "text" : "password"} value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)} placeholder="Access Key" className={`w-full px-6 py-4 rounded-2xl border-2 ${loginError ? 'border-red-500' : 'border-slate-100'} focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-bold`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 ${isRTL ? 'left-4' : 'right-4'}`}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all">
                {t.loginBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Bot */}
      <div id="chat-bot-container" className="fixed bottom-8 right-8 z-[60]" dir="ltr">
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 bg-emerald-600 text-white rounded-2xl shadow-[0_20px_50px_rgba(5,150,105,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group">
            <MessageSquare size={28} />
          </button>
        ) : (
          <div className="w-[90vw] sm:w-[420px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><ShieldCheck size={24} /></div>
                <span className="font-black text-lg">{t.chatTitle}</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-emerald-500 p-2 rounded-xl"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                  <p className="text-sm text-slate-600 font-bold italic leading-relaxed">Assalam-o-Alaikum! I'm your AI Tournament Guide. You can ask me about entry fees, match overs, or rules in Urdu or English.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-bold leading-relaxed ${
                    m.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none shadow-lg' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-sm'
                  }`}>{m.text}</div>
                </div>
              ))}
              {isThinking && <div className="flex gap-2 p-4 bg-white rounded-full w-20 shadow-sm"><div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div></div>}
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex gap-3 shrink-0">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatSend()} placeholder="Ask a question..." className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold" />
              <button onClick={handleChatSend} className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg"><Send size={24} /></button>
            </div>
          </div>
        )}
      </div>

      <footer className="py-20 bg-white border-t border-slate-100 mt-20 no-print">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-2">
            <Trophy className="mx-auto text-emerald-200" size={48} />
            <p className="font-black text-slate-900 text-2xl">By Order of Committee</p>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Lohar Wadha Youth Cup 2026</p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-slate-50">
            <p className="text-xs text-slate-400 font-bold tracking-tighter">Created by Haris Lakhani</p>
            <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-emerald-600 transition-all uppercase tracking-[0.3em] group">
              <Lock size={12} className="group-hover:rotate-12 transition-transform" />
              {t.loginTitle}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
