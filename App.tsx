
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  FileText, 
  ShieldCheck, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
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
  Copy,
  Upload,
  Info,
  CalendarClock,
  Printer,
  Mail,
  MessageCircle,
  Maximize2
} from 'lucide-react';
import { Language, RegistrationData, Player, Message } from './types';

const STORAGE_KEY = 'lohar_wadha_registrations_v6';
const ADMIN_PASSWORD = 'admin123';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ur');
  const [step, setStep] = useState<'welcome' | 'form' | 'success' | 'admin'>('welcome');
  const [formStep, setFormStep] = useState(1);
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [editingRegId, setEditingRegId] = useState<string | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<RegistrationData | null>(null);
  
  // Admin specific viewing state
  const [viewingReg, setViewingReg] = useState<RegistrationData | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const initialPlayers: Player[] = Array.from({ length: 11 }, (_, i) => ({ 
    id: i + 1, 
    name: '', 
    age: '', 
    phone: '', 
    cnic: '', 
    cnicImage: '' 
  }));

  const [formData, setFormData] = useState<Omit<RegistrationData, 'regId' | 'timestamp'>>({
    teamName: '',
    jamatName: '',
    captainName: '',
    viceCaptainName: '',
    players: initialPlayers,
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

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };

  const formatCNIC = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  };

  const handlePlayerChange = (id: number, field: keyof Player, value: string) => {
    let finalValue = value;
    if (field === 'phone') {
      finalValue = formatPhone(value);
    } else if (field === 'cnic') {
      finalValue = formatCNIC(value);
    }

    setFormData(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, [field]: finalValue } : p)
    }));
  };

  const handleImageUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handlePlayerChange(id, 'cnicImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      teamName: '',
      jamatName: '',
      captainName: '',
      viceCaptainName: '',
      players: initialPlayers,
      agreedToTerms: false
    });
    setEditingRegId(null);
    setFormStep(1);
    setLastSubmittedData(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRegId) {
      const updatedData: RegistrationData = { 
        ...formData, 
        regId: editingRegId, 
        timestamp: new Date().toISOString() 
      };
      setRegistrations(prev => prev.map(reg => 
        reg.regId === editingRegId ? updatedData : reg
      ));
      setLastSubmittedData(updatedData);
      setStep('success');
    } else {
      const newReg: RegistrationData = {
        ...formData,
        regId: `LW-${Math.floor(Math.random() * 90000) + 10000}`,
        timestamp: new Date().toISOString()
      };
      setRegistrations(prev => [newReg, ...prev]);
      setLastSubmittedData(newReg);
      setStep('success');
    }
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
      jamatName: reg.jamatName,
      captainName: reg.captainName,
      viceCaptainName: reg.viceCaptainName,
      players: reg.players,
      agreedToTerms: reg.agreedToTerms
    });
    setEditingRegId(reg.regId);
    setStep('form');
  };

  const exportToCSV = () => {
    if (registrations.length === 0) return;
    const headers = ['Reg ID', 'Date', 'Team', 'Jamat Name', 'Captain', 'Vice Captain'];
    const rows = registrations.map(reg => [reg.regId, new Date(reg.timestamp).toLocaleDateString(), reg.teamName, reg.jamatName, reg.captainName, reg.viceCaptainName]);
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
      reg.jamatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.regId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const content = {
    en: {
      title: "Lohar Wadha Tournament",
      subtitle: "Official Registration Portal",
      announcement: "Registration for the upcoming Lohar Wadha Tournament is now open. Total 10 teams only.",
      step1: "Team & Jamat", step2: "Leadership", step3: "Squad", step4: "Payment Info",
      teamName: "Team Name", jamatName: "Jamat Name",
      captainName: "Captain Name", viceCaptainName: "Vice Captain Name",
      player: "Player", terms: "Tournament Rules",
      submit: editingRegId ? "Update Info" : "Complete Registration",
      next: "Next Step", back: "Back", start: "Register Now",
      successTitle: "Registration Confirmed!",
      successMsg: "Your registration form has been generated. Please save this for your records. Payment details will be provided after verification.",
      adminTitle: "Management Portal", totalTeams: "Total Teams",
      export: "Export CSV", noData: "No entries found.",
      loginTitle: "Management Login", loginPrompt: "Enter secure password",
      loginBtn: "Login", 
      invalidPass: "Invalid Access Code", addTeam: "Manual Entry",
      editTeam: "Update Record", search: "Search teams...",
      paymentHeading: "Payment Information",
      paymentInstruction: "Payment details will be shared after teams confirm.",
      paymentDeadlineLabel: "Last Day to Submit Fees",
      paymentDeadlineDate: "18-Feb-2026",
      colName: "Name", colAge: "Age", colPhone: "Phone", colCNIC: "CNIC/B-Form", colImage: "CNIC Picture Upload",
      squadNotice: "If a player does not have a CNIC, enter the B-Form number and upload a personal photo instead of the CNIC image.",
      returnHome: "Return Home",
      registrationFormTitle: "OFFICIAL REGISTRATION FORM - 2026",
      contactUs: "Contact Us",
      contactEmail: "Email",
      thankYouNote: "Thank you for registration. If you are shortlisted, we will inform you.",
      orgName: "Lohar Wada Youth Organization",
      orgMotto: "(ایک نئی سوچ، ایک نئی تعمیر)",
      rules: [
        "Tournament entry fee: 10,000 PKR per team.",
        "Entry fee must be paid by the assigned deadline before the tournament starts.",
        "Tournament committee will provide balls and tape. Winners and Runners-up will receive trophies and prize money.",
        "All matches will consist of 6 overs (except semi-finals and finals).",
        "Tournament will consist of 10 teams: 5 from Lohar Wadha and 5 from other Kutchi communities.",
        "10 teams will be divided into 2 groups; each team plays 4 group matches.",
        "All teams must arrive at the ground by 10:30 PM. Overs will be cut for arrivals after 11:00 PM.",
        "Kutchi community teams must only include players from that specific community.",
        "Each team must submit player details verified on their community's official letterhead.",
        "Playing non-community players will result in immediate disqualification.",
        "Only registered players listed on the form are allowed to play; no substitutions allowed.",
        "Boundary and scoring rules specific to Lohar Wadha Hall will be briefed to captains before match start.",
        "In case of disputes, only the captain may talk to umpires or the committee.",
        "Captains are responsible for team behavior. Warning followed by player expulsion for misconduct.",
        "Repeated violations will result in the entire team being disqualified.",
        "Arguing, shouting, or misbehavior with umpires results in immediate 3-over penalty and player expulsion.",
        "Abusive language, fighting, or provoking opponents results in immediate permanent expulsion.",
        "Disrupting the tournament or fighting after losing results in a permanent ban for the team and players.",
        "Compliance with all rules and regulations is mandatory for every team.",
        "Lohar Wadha Youth Committee and Tournament Committee decisions are final and binding."
      ]
    },
    ur: {
      title: "لوہار وادھا ٹورنامنٹ",
      subtitle: "آفیشل رجسٹریشن پورٹل",
      announcement: "لوہار وادھا ٹورنامنٹ کے لیے رجسٹریشن کا آغاز ہو چکا ہے۔ صرف 10 ٹیموں کی گنجائش ہے۔",
      step1: "ٹیم اور جماعت", step2: "قیادت", step3: "کھلاڑیوں کی فہرست", step4: "پیمنٹ کی تفصیل",
      teamName: "ٹیم کا نام", jamatName: "جماعت کا نام",
      captainName: "کپتان کا نام", viceCaptainName: "نائب کپتان کا نام",
      player: "کھلاڑی", terms: "قواعد و ضوابط",
      submit: editingRegId ? "معلومات تبدیل کریں" : "رجسٹریشن مکمل کریں",
      next: "اگلا مرحلہ", back: "واپس", start: "رجسٹریشن شروع کریں",
      successTitle: "رجسٹریشن مکمل ہوگئی!",
      successMsg: "آپ کا رجسٹریشن فارم تیار کر دیا گیا ہے۔ براہِ کرم اسے محفوظ کریں؛ ادائیگی کی تفصیلات تصدیق کے بعد فراہم کی جائیں گی۔",
      adminTitle: "مینجمنٹ ڈیش بورڈ", totalTeams: "کل ٹیمیں",
      export: "CSV ڈاؤن لوڈ کریں", noData: "کوئی ریکارڈ نہیں ملا۔",
      loginTitle: "مینجمنٹ لاگ ان", loginPrompt: "سیکیورٹی پاس ورڈ درج کریں",
      loginBtn: "لاگ ان کریں", 
      invalidPass: "غلط پاس ورڈ", addTeam: "نئی ٹیم شامل کریں",
      editTeam: "معلومات اپ ڈیٹ کریں", search: "ٹیم تلاش کریں...",
      paymentHeading: "پیمنٹ کی معلومات",
      paymentInstruction: "پیمنٹ کی تفصیلات ٹیموں کی تصدیق کے بعد شیئر کی جائیں گی۔",
      paymentDeadlineLabel: "فیس جمع کروانے کی آخری تاریخ",
      paymentDeadlineDate: "18 فروری 2026",
      colName: "نام", colAge: "عمر", colPhone: "فون نمبر", colCNIC: "CNIC/ب فارم", colImage: "CNIC تصویر اپ لوڈ",
      squadNotice: "اگر کسی کھلاڑی کے پاس CNIC نہیں ہے تو ب-فارم نمبر درج کریں اور CNIC تصویر کے بجائے اپنی ذاتی تصویر اپ لوڈ کریں۔",
      returnHome: "ہوم پیج پر جائیں",
      registrationFormTitle: "آفیشل رجسٹریشن فارم - 2026",
      contactUs: "رابطہ کریں",
      contactEmail: "ای میل",
      thankYouNote: "رجسٹریشن کے لیے شکریہ۔ اگر آپ کو شارٹ لسٹ کیا گیا تو ہم آپ کو مطلع کریں گے۔",
      orgName: "لوہارواڈھا یوتھ آرگنائزیشن",
      orgMotto: "(ایک نئی سوچ، ایک نئی تعمیر)",
      rules: [
        "ٹورنامنٹ کی انٹری فیس 10,000 ایک ٹیم ہوگی۔",
        "انٹری فیس ٹورنامنٹ شروع ہونے سے پہلے کی مقررہ تاریخ تک جمع کروانا لازمی ہوگی۔",
        "ٹورنامنٹ میں بال اور ٹیپ ٹورنامنٹ کمیٹی دے گی۔اور فائنل اور رنراپ کو ٹرافی کے ساتھ ساتھ انعامی رقم بھی دی جاے گی",
        "ٹورنامنٹ کے تمام میچز 6 اوورز پر مشتمل ہو گے۔(سیمی فائنل اور فائنل کے علاوہ)",
        "یہ ٹورنامنٹ ٹوٹل 10 ٹیموں پر مشتمل ہوگا۔جس میں 5 ٹیمیں لوہارواڈھا برادری اور باقی 5 ٹیمیں دیگر کچھی کمیونٹی سے ہوگی۔",
        "10 ٹیموں کو 2 گروپ میں تقسیم کیا جائے گا۔ اور ہر ایک ٹیم اپنے 4 میچز کھیلے گی",
        "ٹورنامنٹ کی تمام ٹیموں کو رات10:30 تک گروانڈ میں ہونا لازمی ہے11:00 بجے کے بعد آنے والی ٹیم کے ٹائم کے حساب سے اوورز کی کٹوتی کی جائے گی",
        "جو بھی ٹیم کسی بھی کچھی کمیونٹی کی طرف سے کھیلے گی اس ٹیم میں صرف و صرف اسی کچھی کمیونٹی کے کھلاڑی کھیل سکتے ہیں۔",
        "ہر ٹیم اپنے کھلاڑیوں کی ڈیٹیل اپنے کمیونٹی کے لیٹر ہیڈ پر تصدیقی طور پر جمع کروائے گی۔",
        "غیر کمیونٹی کھلاڑی کو ٹیم میں کھلانے پر ٹیم کو ٹورنامنٹ سے باہر کردیا جائے گا۔ ریجسٹریشن فارم پر ریجسٹرد کیے ہوئے پلیئرز کے علاوہ کوئی اور پلیئرز نہیں کھیلے گا۔",
        "جیسا کہ یہ ٹورنامنٹ لوہارواڈھا ھال میں ہے تو اس ٹورنامنٹ کی باؤنڈری کی حدود اور اسکور کے رولز کپتان کو میچ شروع ہونے سے پہلے بتا دیے جاے گے",
        "میچ کے دوران کسی بھی قسم کے تنازعات کی صورت میں اس ٹیم کا کپتان ہی امپائر اور ٹورنامنٹ کمیٹی سے بات کرےگا۔",
        "ہر ٹیم کا کپتان اپنی پوری ٹیم کے رویے کا ذمہ دار ہوگااگر کسی کھلاڑی نے بدتمیزی کی تو پہلے کپتان کو وارننگ دی جائے گی۔اس کے بعد بھی اس کھلاڑی کا رویّہ درست نہیں ہوا تو اس کھلاڑی کو ٹورنامنٹ سے باہر کردیا جائے گا۔",
        "مسلسل خلاف ورزی پر پوری ٹیم کو ٹورنامنٹ سے باہر کردیا جائے گا۔",
        "امپائر کے فیصلے پر بحث، چیخنا چلانا یا بدتمیزی پر فوری جرمانہ کے طور پر دوران میچ 3 اوورز کی کٹوتی کی جائے گی اور امپائر سے بدتمیزی کرنے والا کھلاڑی اسی وقت گراؤنڈ سے باہر بھی ہوگا۔",
        "کسی بھی قسم کی گالم گلوج، بدتمیزی لڑائی جگڑے یا مخالف ٹیم کو اشتعال دلانے پر فوری طور ٹیم کو اسی وقت ٹورنامنٹ سے ہمیشہ کے لئے باہر کر دیا جائے گا۔",
        "کوئی ٹیم ہارنے کی صورت میں جان بوجھ کر لڑائی جگڑے گالم گلوج اور فسادات کرنے اور ٹورنامنٹ کو خراب کرنے کی کوشش کرے گی اس ٹیم اور ٹیم کے تمام کھلاڑیوں پر ہمیشہ کے لیے اس ٹورنامنٹ میں کھیلنے پر پابندی عائد کردی جائے گی۔",
        "ہر ٹیم کو اس رولز ریگولیشن اور قوانین پر عمل درآمد کرنا لازمی ہوگا۔",
        "کسی بھی تنازعات ، شکایات، یا دیگر معاملے میں لوہارواڈھا یوتھ کمیٹی اور ٹورنامنٹ کمیٹی کا فیصلہ حتمی اور قابل قبول ہوگا۔ جس پر تمام ٹیموں کو عمل کرنا لازمی ہوگا۔"
      ]
    }
  };

  const t = content[lang];
  const isRTL = lang === 'ur';

  const contactList = [
    { name: isRTL ? "مزمل" : "Muzammil", phone: "03360024657" },
    { name: isRTL ? "نعمان" : "Noman", phone: "03232179217" },
    { name: isRTL ? "مصطفیٰ" : "Mustafa", phone: "03062858558" },
    { name: isRTL ? "لوہارواڈھا یوتھ" : "Lohar Wadha Youth", phone: "0325338338" },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'font-urdu' : 'font-sans'} bg-slate-50`} dir={isRTL ? 'rtl' : 'ltr'}>
      <nav className="sticky top-0 z-50 glass shadow-md px-6 py-4 flex justify-between items-center border-b border-emerald-100 no-print">
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px] overflow-y-auto custom-scrollbar p-2">
                    {t.rules.map((rule, idx) => (
                      <div key={idx} className="bg-white/70 p-4 rounded-2xl border border-amber-200 flex gap-4 items-start transform hover:scale-[1.01] transition-transform">
                        <span className="shrink-0 bg-amber-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shadow-md">
                          {idx + 1}
                        </span>
                        <p className="text-amber-900 text-sm font-bold leading-relaxed">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 shadow-sm space-y-8">
                  <h3 className="flex items-center gap-3 font-black text-emerald-900 text-2xl">
                    <MessageCircle size={32} className="text-emerald-600" />
                    {t.contactUs}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {contactList.map((contact, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-emerald-200 flex justify-between items-center shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{contact.name}</p>
                          <p className="text-lg font-black text-slate-800 tracking-tight">{contact.phone}</p>
                        </div>
                        <a href={`tel:${contact.phone}`} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                          <Phone size={20} />
                        </a>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                        <Mail size={24} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{t.contactEmail}</p>
                        <p className="text-sm sm:text-base font-black text-slate-800 break-all">loharwadayouthorganization@gmail.com</p>
                      </div>
                    </div>
                    <button onClick={() => copyToClipboard("loharwadayouthorganization@gmail.com")} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                      <Copy size={20} />
                    </button>
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
          <div className="max-w-full mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-2 mb-4 max-w-4xl mx-auto">
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

            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
              {formStep === 1 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300 max-w-4xl mx-auto">
                  <h2 className="text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                    <Trophy className="text-emerald-600" /> {t.step1}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">{t.teamName}</label>
                      <input required type="text" value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} placeholder="Lohar Tigers" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none bg-slate-50 font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">{t.jamatName}</label>
                      <input required type="text" value={formData.jamatName} onChange={e => setFormData({...formData, jamatName: e.target.value})} placeholder="Jamat Name" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none bg-slate-50 font-bold" />
                    </div>
                  </div>
                  <button type="button" onClick={() => setFormStep(2)} className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl mt-4 flex items-center justify-center gap-2 shadow-lg">
                    {t.next} <ArrowRight className={isRTL ? 'rotate-180' : ''} />
                  </button>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300 max-w-4xl mx-auto">
                  <h2 className="text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                    <User className="text-emerald-600" /> {t.step2}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">{t.captainName}</label>
                        <input required type="text" value={formData.captainName} onChange={e => setFormData({...formData, captainName: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">{t.viceCaptainName}</label>
                        <input required type="text" value={formData.viceCaptainName} onChange={e => setFormData({...formData, viceCaptainName: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setFormStep(1)} className="flex-1 border border-slate-200 font-black py-4 rounded-2xl">{t.back}</button>
                    <button type="button" onClick={() => setFormStep(3)} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg">{t.next}</button>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300 w-full overflow-hidden">
                  <h2 className="text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                    <Users className="text-emerald-600" /> {t.step3}
                  </h2>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-2xl flex items-start gap-3 shadow-sm">
                    <Info className="text-blue-500 shrink-0 mt-1" size={20} />
                    <p className="text-sm font-bold text-blue-900 leading-relaxed">
                      {t.squadNotice}
                    </p>
                  </div>

                  <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <div className="min-w-[800px] space-y-3">
                      <div className="grid grid-cols-[40px_2fr_1fr_1.5fr_1.5fr_1.5fr] gap-3 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <div>#</div>
                        <div>{t.colName}</div>
                        <div>{t.colAge}</div>
                        <div>{t.colPhone}</div>
                        <div>{t.colCNIC}</div>
                        <div className="text-center">{t.colImage}</div>
                      </div>

                      {formData.players.map((p) => (
                        <div key={p.id} className="grid grid-cols-[40px_2fr_1fr_1.5fr_1.5fr_1.5fr] gap-3 items-center bg-white border border-slate-100 p-2 rounded-2xl hover:shadow-md transition-shadow group">
                          <div className="text-sm font-black text-emerald-600/40 text-center italic">{p.id}</div>
                          
                          <input required type="text" value={p.name} onChange={e => handlePlayerChange(p.id, 'name', e.target.value)} placeholder={t.colName} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                          
                          <input required type="number" value={p.age} onChange={e => handlePlayerChange(p.id, 'age', e.target.value)} placeholder={t.colAge} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                          
                          <input required type="tel" value={p.phone} onChange={e => handlePlayerChange(p.id, 'phone', e.target.value)} placeholder="03xx-xxxxxxx" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                          
                          <input required type="text" value={p.cnic} onChange={e => handlePlayerChange(p.id, 'cnic', e.target.value)} placeholder="xxxxx-xxxxxxx-x" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                          
                          <div className="flex justify-center">
                            <label className={`cursor-pointer px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-black w-full ${p.cnicImage ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                              {p.cnicImage ? <CheckCircle2 size={18} /> : <Camera size={18} />}
                              {p.cnicImage ? 'Uploaded' : 'Upload'}
                              <input type="file" accept="image/*" onChange={e => handleImageUpload(p.id, e)} className="hidden" />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 max-w-4xl mx-auto">
                    <button type="button" onClick={() => setFormStep(2)} className="flex-1 border border-slate-200 font-black py-4 rounded-2xl">{t.back}</button>
                    <button type="button" onClick={() => setFormStep(4)} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg">{t.next}</button>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-300 max-w-4xl mx-auto">
                  <h2 className="text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                    <CreditCard className="text-emerald-600" /> {t.step4}
                  </h2>
                  
                  <div className="bg-red-50 border border-red-200 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm animate-pulse-subtle">
                    <div className="bg-red-600 p-3 rounded-2xl text-white">
                      <CalendarClock size={28} />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-red-900 font-black text-lg">{t.paymentDeadlineLabel}</p>
                      <p className="text-red-600 font-black text-2xl tracking-tight">{t.paymentDeadlineDate}</p>
                    </div>
                  </div>

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

                    <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="bg-emerald-50 p-4 rounded-full">
                        <ShieldCheck className="text-emerald-600" size={32} />
                      </div>
                      <p className="text-lg font-black text-emerald-900 leading-tight italic">
                        "{t.paymentInstruction}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl flex items-start gap-4 border border-slate-200">
                    <input id="agree" required type="checkbox" checked={formData.agreedToTerms} onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})} className="mt-1 w-6 h-6 text-emerald-600 rounded-lg border-slate-300 focus:ring-emerald-500 cursor-pointer" />
                    <label htmlFor="agree" className="text-sm text-slate-700 cursor-pointer font-bold leading-relaxed">{lang === 'ur' ? 'میں تصدیق کرتا ہوں کہ تمام معلومات درست ہیں اور میں ٹورنامنٹ کے تمام قوانین پر عمل درآمد کا پابند ہوں۔' : 'I confirm all info is correct and I am bound to follow all tournament rules and regulations.'}</label>
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

        {step === 'success' && lastSubmittedData && (
          <div className="max-w-4xl mx-auto py-12 animate-in zoom-in-95 duration-700 text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900">{t.successTitle}</h2>
              <p className="text-slate-600 text-lg leading-relaxed font-medium max-w-2xl mx-auto">
                {t.successMsg}
              </p>
            </div>

            <div id="printable-ticket-wrapper" className="flex justify-center">
              <div id="printable-ticket" className="bg-white shadow-2xl border-4 border-slate-100 rounded-lg overflow-hidden w-full max-w-[800px] min-h-[1100px] flex flex-col text-left" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="bg-emerald-900 text-white p-10 flex justify-between items-center border-b-8 border-emerald-500">
                  <div className="space-y-2">
                    <div className="bg-white/10 px-4 py-1 rounded-full inline-block backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">Official Document</p>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">{t.registrationFormTitle}</h1>
                    <p className="text-emerald-400 font-bold opacity-80 uppercase tracking-widest">{t.title} - Youth Cup</p>
                  </div>
                  <div className="bg-white p-4 rounded-3xl shadow-lg">
                    <Trophy size={60} className="text-emerald-700" />
                  </div>
                </div>

                <div className="p-12 space-y-12 flex-1">
                  <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Number</p>
                      <p className="text-2xl font-black text-emerald-700">{lastSubmittedData.regId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Issued</p>
                      <p className="text-lg font-black text-slate-800">{new Date(lastSubmittedData.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.teamName}</p>
                        <p className="text-2xl font-black text-slate-900 border-b-2 border-emerald-100 pb-2">{lastSubmittedData.teamName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.jamatName}</p>
                        <p className="text-xl font-bold text-slate-700">{lastSubmittedData.jamatName}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.captainName}</p>
                        <p className="text-xl font-black text-slate-900 border-b-2 border-emerald-100 pb-2">{lastSubmittedData.captainName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.viceCaptainName}</p>
                        <p className="text-lg font-bold text-slate-700">{lastSubmittedData.viceCaptainName}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                      <Users size={20} className="text-emerald-600" /> {t.step3}
                    </h3>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-4 py-3 text-center w-10">#</th>
                            <th className="px-4 py-3 text-left">{t.colName}</th>
                            <th className="px-4 py-3 text-center">{t.colAge}</th>
                            <th className="px-4 py-3 text-left">{t.colPhone}</th>
                            <th className="px-4 py-3 text-left">{t.colCNIC}</th>
                            <th className="px-4 py-3 text-center">Docs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lastSubmittedData.players.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-center text-slate-400 font-bold">{p.id}</td>
                              <td className="px-4 py-3 font-black text-slate-800">{p.name || '-'}</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-600">{p.age || '-'}</td>
                              <td className="px-4 py-3 text-slate-700 font-medium">{p.phone || '-'}</td>
                              <td className="px-4 py-3 text-slate-700 font-mono text-xs">{p.cnic || '-'}</td>
                              <td className="px-4 py-3 text-center">
                                {p.cnicImage ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                                    <CheckCircle2 size={10} /> {lang === 'ur' ? 'اپ لوڈ' : 'Verified'}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500 p-2 rounded-xl text-white">
                        <CreditCard size={20} />
                      </div>
                      <h4 className="font-black text-amber-900">{t.paymentHeading}</h4>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[1.5rem] border border-amber-200 flex flex-col items-center justify-center text-center space-y-2">
                       <p className="text-base font-black text-amber-900 italic">
                        "{t.paymentInstruction}"
                       </p>
                      <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                        {t.paymentDeadlineLabel}: {t.paymentDeadlineDate}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-10 border-t border-slate-200 flex justify-between items-center mt-auto">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organized By</p>
                    <p className="text-sm font-black text-slate-800">Lohar Wadha Committee</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="w-1.5 h-12 bg-slate-200 rounded-full"></div>)}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Stamp</p>
                    <div className="w-16 h-16 border-4 border-emerald-600/20 rounded-full flex items-center justify-center text-emerald-600/20 font-black text-[8px] rotate-12">
                      OFFICIAL
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center no-print">
              <button 
                onClick={() => { resetForm(); setStep('welcome'); }} 
                className="bg-white border-2 border-slate-200 px-10 py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all text-xl"
              >
                {t.returnHome}
              </button>
            </div>

            <div className="space-y-8 pt-10 no-print animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="inline-block bg-emerald-50 px-8 py-5 rounded-[2rem] border border-emerald-100 shadow-sm">
                <p className="text-emerald-900 font-black text-xl md:text-2xl leading-relaxed italic">
                  {t.thankYouNote}
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  {t.orgName}
                </h4>
                <p className="text-emerald-600 font-bold text-xl md:text-2xl">
                  {t.orgMotto}
                </p>
              </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="bg-emerald-600 p-8 rounded-[2rem] shadow-xl text-white">
                <p className="text-emerald-100 text-sm font-black uppercase tracking-widest mb-1">{t.totalTeams}</p>
                <p className="text-5xl font-black">{registrations.length}</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 relative overflow-hidden group">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-100 w-24 h-24 -mr-8 group-focus-within:text-emerald-50 transition-colors" />
                <div className="relative z-10 space-y-2">
                  <label className="text-slate-400 text-sm font-black uppercase tracking-widest">{t.search}</label>
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Name / Jamat / ID" className="w-full bg-transparent font-bold outline-none text-slate-800" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left" dir="ltr">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team / Pass</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Jamat Info</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Leadership</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRegistrations.length === 0 ? (
                      <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">{t.noData}</td></tr>
                    ) : (
                      filteredRegistrations.map((reg) => (
                        <tr key={reg.regId} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="text-xs font-black text-emerald-600 mb-1">{reg.regId}</div>
                            <div className="text-lg font-black text-slate-800">{reg.teamName}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{new Date(reg.timestamp).toLocaleString()}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm font-bold text-slate-800">{reg.jamatName}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xs font-bold text-slate-800">C: {reg.captainName}</div>
                            <div className="text-xs text-slate-500 font-medium">VC: {reg.viceCaptainName}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setViewingReg(reg)} title="View Details" className="p-3 bg-white border border-slate-100 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Eye size={18} /></button>
                              <button onClick={() => startEdit(reg)} title="Edit" className="p-3 bg-white border border-slate-100 text-slate-600 rounded-xl hover:bg-slate-600 hover:text-white transition-all shadow-sm"><Edit2 size={18} /></button>
                              <button onClick={() => deleteRegistration(reg.regId)} title="Delete" className="p-3 bg-white border border-slate-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
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

      {/* Admin Detail View Modal */}
      {viewingReg && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
            <div className="bg-emerald-900 p-8 text-white flex justify-between items-center border-b-8 border-emerald-500 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl">
                  <Trophy size={32} className="text-emerald-700" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Team Details</p>
                  <h3 className="text-2xl font-black tracking-tight">{viewingReg.teamName}</h3>
                </div>
              </div>
              <button onClick={() => setViewingReg(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jamat Info</p>
                    <p className="text-xl font-bold text-slate-900">{viewingReg.jamatName}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration ID</p>
                    <p className="text-xl font-black text-emerald-700">{viewingReg.regId}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(viewingReg.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Captain</p>
                      <p className="text-lg font-black text-slate-900">{viewingReg.captainName}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vice Captain</p>
                    <p className="text-lg font-black text-slate-900">{viewingReg.viceCaptainName}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Users size={24} className="text-emerald-600" /> Team Squad & Documentation
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {viewingReg.players.map((p) => (
                    <div key={p.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 italic">
                          {p.id}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg">{p.name || "N/A"}</p>
                          <p className="text-xs text-slate-500 font-bold">Age: {p.age || "N/A"} • Phone: {p.phone || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">CNIC/B-Form</p>
                          <p className="text-sm font-mono font-bold text-slate-700">{p.cnic || "Not Provided"}</p>
                        </div>
                        
                        {p.cnicImage ? (
                          <button 
                            onClick={() => setSelectedImage(p.cnicImage!)}
                            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl font-black text-sm hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            <ImageIcon size={18} />
                            View Document
                            <Maximize2 size={14} className="opacity-50" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-300 px-5 py-3 rounded-2xl font-black text-sm italic">
                            No Picture Uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
               <button onClick={() => deleteRegistration(viewingReg.regId)} className="flex items-center gap-2 text-red-600 font-black hover:bg-red-50 px-6 py-3 rounded-xl transition-all">
                <Trash2 size={20} /> Remove Entry
               </button>
               <button onClick={() => setViewingReg(null)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all">
                Close Viewer
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Admin Image Viewing */}
      {selectedImage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in-95 duration-300" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-10 right-10 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all">
            <X size={40} />
          </button>
          <div className="max-w-full max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 border-white/20" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="CNIC Document" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

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
