
import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";
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
  ImageIcon,
  CreditCard,
  Copy,
  Upload,
  Info,
  CalendarClock,
  Printer,
  Mail,
  MessageCircle,
  Maximize2,
  Zap,
  FileUp,
  ShieldQuestion
} from 'lucide-react';
import { Language, RegistrationData, Player, Message } from './types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const STORAGE_KEY = 'loharwadha_registrations_v7';
const RESTRICTIONS_KEY = 'loharwadha_restrictions_enabled';
const ADMIN_PASSWORD = '@Youth#1123';
const SUPER_ADMIN_PASSWORD = '@Haris00666600';

/** 
 * Direct link provided by the user from Facebook.
 */
const LOGO_URL = 'https://scontent.fkhi28-1.fna.fbcdn.net/v/t39.30808-6/307930514_222437570114872_9142880630097216513_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=1YL41LIw5ssQ7kNvwEtxb6w&_nc_oc=Adlt3TfpwlXdckjxkxPdF1G-Co5O0FZuwbueOJE3K5_Kk6TE72YEQ7Jsy-kiCNPSHk8&_nc_zt=23&_nc_ht=scontent.fkhi28-1.fna&_nc_gid=pWAyiIBq_v5Cxuho06l-Nw&oh=00_Afu_NHoKbL6_5WtWeSL4BY9In-Tvhu_tXjjaBAx1rlEqww&oe=699A733E'; 

const Watermark: React.FC = () => (
  <div className="watermark-overlay" aria-hidden="true">
    <img 
      src={LOGO_URL} 
      alt="" 
      className="watermark-image" 
      crossOrigin="anonymous"
      onError={(e) => (e.currentTarget.style.display = 'none')}
    />
  </div>
);

const contactList = [
  { name: 'Muzammil', phone: '03360024657' },
  { name: 'Noman', phone: '03232179217' },
  { name: 'Mustafa', phone: '03062858558' },
  { name: 'Loharwadha Youth', phone: '0325338338' },
];

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard: " + text);
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
};

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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [restrictionsEnabled, setRestrictionsEnabled] = useState(true);
  
  const [editingRegId, setEditingRegId] = useState<string | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<RegistrationData | null>(null);
  const [viewingReg, setViewingReg] = useState<RegistrationData | null>(null);
  const [logoError, setLogoError] = useState(false);

  const initialPlayers: Player[] = Array.from({ length: 12 }, (_, i) => ({ 
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
  const fetchData = async () => {
    try {
      const snapshot = await getDocs(collection(db, "registrations"));
      const data = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as RegistrationData[];

      setRegistrations(data);

    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  fetchData();

  const savedRestrictions = localStorage.getItem(RESTRICTIONS_KEY);
  if (savedRestrictions !== null) {
    setRestrictionsEnabled(savedRestrictions === 'true');
  }

}, []);

  useEffect(() => {
    localStorage.setItem(RESTRICTIONS_KEY, String(restrictionsEnabled));
  }, [restrictionsEnabled]);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'ur' : 'en');

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };

  const handlePlayerChange = (id: number, field: keyof Player, value: string) => {
    let finalValue = value;
    if (field === 'phone') {
      finalValue = formatPhone(value);
    }
    setFormData(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, [field]: finalValue } : p)
    }));
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

  const validateSquad = () => {
    if (!restrictionsEnabled) return true;
    const localPhones = new Set<string>();
    const globalPhones = new Map<string, string>();
    registrations.forEach(reg => {
      if (reg.regId === editingRegId) return;
      reg.players.forEach(p => {
        if (p.phone) globalPhones.set(p.phone, reg.teamName);
      });
    });
    for (const p of formData.players) {
      if (!p.name.trim() || !p.age.trim() || !p.phone.trim()) {
        const msg = lang === 'ur' 
          ? "کچھ لازمی خانے خالی ہیں۔ براہ کرم آگے بڑھنے سے پہلے تمام خانے پر کریں۔ فارم آگے نہیں بڑھ سکتا۔"
          : "Some required fields are missing. Please complete all fields before proceeding. The form cannot move forward.";
        alert(msg);
        return false;
      }
      const isDuplicate = localPhones.has(p.phone) || globalPhones.has(p.phone);
      if (isDuplicate) {
        const msg = lang === 'ur'
          ? "ڈپلیکیٹ انٹری ملی ہے۔ براہ کرم منفرد فون نمبر استعمال کریں۔ فارم آگے نہیں بڑھ سکتا۔"
          : "Duplicate entry detected. Please use a unique Phone Number. The form cannot proceed.";
        alert(msg);
        return false;
      }
      localPhones.add(p.phone);
    }
    return true;
  };

  const handleStep3Next = () => {
    if (validateSquad()) {
      setFormStep(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateSquad()) return;

  try {
    const newReg: RegistrationData = {
      ...formData,
      regId: `LW-${Math.floor(Math.random() * 90000) + 10000}`,
      timestamp: new Date().toISOString()
    };

    console.log("Submitting to Firebase:", newReg);
    const docRef = await addDoc(collection(db, "registrations"), newReg);
    console.log("Saved successfully");

    setRegistrations(prev => [...prev, newReg]);  // 🔥 IMPORTANT

    setLastSubmittedData(newReg);
    setStep('success');

  } catch (error) {
    console.error("Save error:", error);
    alert("Failed to save data");
  }
};

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPasswordInput === SUPER_ADMIN_PASSWORD) {
      setAdminAuth(true);
      setIsSuperAdmin(true);
      setStep('admin');
      setIsLoginModalOpen(false);
      setAdminPasswordInput('');
      setLoginError(false);
    } else if (adminPasswordInput === ADMIN_PASSWORD) {
      setAdminAuth(true);
      setIsSuperAdmin(false);
      setStep('admin');
      setIsLoginModalOpen(false);
      setAdminPasswordInput('');
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
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

  const downloadSampleCSV = () => {
    const headers = ['Team Name', 'Jamat Name', 'Captain Name', 'Vice Captain Name', 'P1 Name', 'P1 Age', 'P1 Phone', 'P2 Name', 'P2 Age', 'P2 Phone'];
    const sample = ['Sample Team', 'Sample Jamat', 'John Doe', 'Jane Doe', 'Player 1', '25', '0300-0000000', 'Player 2', '24', '0300-1111111'];
    const csvContent = [headers, sample].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `loharwadha_import_sample.csv`;
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;
      const newEntries: RegistrationData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length < 4 || !row[0].trim()) continue;
        const players: Player[] = Array.from({ length: 12 }, (_, idx) => {
          const baseOffset = 4 + (idx * 3);
          return {
            id: idx + 1,
            name: row[baseOffset] || '',
            age: row[baseOffset + 1] || '',
            phone: row[baseOffset + 2] || '',
            cnic: '',
            cnicImage: ''
          };
        });
        newEntries.push({
          regId: `LW-IMP-${Math.floor(Math.random() * 90000) + 10000}`,
          timestamp: new Date().toISOString(),
          teamName: row[0],
          jamatName: row[1],
          captainName: row[2],
          viceCaptainName: row[3],
          players: players,
          agreedToTerms: true
        });
      }
      if (newEntries.length > 0) {
        alert(`${newEntries.length} teams imported successfully!`);
      }
    };
    reader.readAsText(file);
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
      title: "Loharwadha Tournament",
      subtitle: "Official Registration Portal",
      announcement: "Registration for the upcoming Loharwadha Tournament is now open. Total 10 teams only.",
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
      loginBtn: "Log in", 
      invalidPass: "Invalid Access Code", addTeam: "Manual Entry",
      editTeam: "Update Record", search: "Search teams...",
      paymentHeading: "Payment Information",
      paymentInstruction: "Payment details will be shared after teams confirm.",
      paymentDeadlineLabel: "Last Day to Submit Fees",
      paymentDeadlineDate: "18-Feb-2026",
      colName: "Name", colAge: "Age", colPhone: "Phone",
      returnHome: "Return Home",
      registrationFormTitle: "OFFICIAL REGISTRATION FORM - 2026",
      contactUs: "Contact Us",
      contactEmail: "Email",
      thankYouNote: "Thank you for registration. If you are shortlisted, we will inform you.",
      orgName: "Loharwadha Youth Organization",
      orgMotto: "(ایک نئی سوچ، ایک نئی تعمیر)",
      rules: [
        "Tournament entry fee: 10,000 PKR per team.",
        "Entry fee must be paid by the assigned deadline before the tournament starts.",
        "Tournament committee will provide balls and tape. Winners and Runners-up will receive trophies and prize money.",
        "All matches will consist of 6 overs (except semi-finals and finals).",
        "Tournament will consist of 10 teams: 5 from Loharwadha and 5 from other Kutchi communities.",
        "10 teams will be divided into 2 groups; each team plays 4 group matches.",
        "All teams must arrive at the ground by 10:30 PM. Overs will be cut for arrivals after 11:00 PM.",
        "Kutchi community teams must only include players from that specific community.",
        "Each team must submit player details verified on their community's official letterhead.",
        "Playing non-community players will result in immediate disqualification.",
        "Only registered players listed on the form are allowed to play; no substitutions allowed.",
        "Boundary and scoring rules specific to Loharwadha Hall will be briefed to captains before match start.",
        "In case of disputes, only the captain may talk to umpires or the committee.",
        "Captains are responsible for team behavior. Warning followed by player expulsion for misconduct.",
        "Repeated violations will result in the entire team being disqualified.",
        "Arguing, shouting, or misbehavior with umpires results in immediate 3-over penalty and player expulsion.",
        "Abusive language, fighting, or provoking opponents results in immediate permanent expulsion.",
        "Disrupting the tournament or fighting after losing results in a permanent ban for the team and players.",
        "Compliance with all rules and regulations is mandatory for every team.",
        "Loharwadha Youth Committee and Tournament Committee decisions are final and binding."
      ]
    },
    ur: {
      title: "لوہارواڈھا ٹورنامنٹ",
      subtitle: "آفیشل رجسٹریشن پورٹل",
      announcement: "لوہارواڈھا ٹورنامنٹ کے لیے رجسٹریشن کا آغاز ہو چکا ہے۔ صرف 10 ٹیموں کی گنجائش ہے۔",
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
      loginBtn: "لوگ ان کریں", 
      invalidPass: "غلط پاس ورڈ", addTeam: "نئی ٹیم شامل کریں",
      editTeam: "معلومات اپ ڈیٹ کریں", search: "ٹیم تلاش کریں...",
      paymentHeading: "پیمنٹ کی معلومات",
      paymentInstruction: "پیمنٹ کی تفصیلات ٹیموں کی تصدیق کے بعد شیئر کی جائیں گی۔",
      paymentDeadlineLabel: "فیس جمع کروانے کی آخری تاریخ",
      paymentDeadlineDate: "18 فروری 2026",
      colName: "نام", colAge: "عمر", colPhone: "فون نمبر",
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
        "امپائر کے فیصلے پر بحث، چیخنا چلانا یا بدتمیزی پر فوری جرمانہ کے طور پر دوران میچ 3 اوورز کی کٹوتی کی جائے گی اور امپائر سے بدتمیزی کرنے والا کھلاڑی اسی وقت گراؤنڈ سے باہر भी ہوگا۔",
        "کسی بھی قسم کی گالم گلوج، بدتمیزی لڑائی جگڑے یا مخالف ٹیم کو اشتعال دلانے پر فوری طور ٹیم کو اسی وقت ٹورنامنٹ سے ہمیشہ کے لئے باہر کر دیا جائے گا۔",
        "کوئی ٹیم ہارنے کی صورت میں جان بوجھ کر لڑائی جگڑے گالم گلوج اور فسادات کرنے اور ٹورنامنٹ کو خراب کرنے کی کوشش کرے گی اس ٹیم اور ٹیم کے تمام کھلاڑیوں پر ہمیشہ کے لیے اس ٹورنامنٹ میں کھیلنے پر پابندی عائد کردی جائے گی۔",
        "ہر ٹیم کو اس رولز ریگولیشن اور قوانین پر عمل درآمد کرنا لازمی ہوگا۔",
        "کسی بھی تنازعات ، شکایات، یا دیگر معاملے میں لوہارواڈھا یوتھ کمیٹی اور ٹورنامنٹ کمیٹی کا فیصلہ حتمی اور قابل قبول ہوگا۔ جس پر تمام ٹیموں کو عمل کرنا لازمی ہوگا۔"
      ]
    }
  };

  const t = content[lang];
  const isRTL = lang === 'ur';

  // Component to render the community logo with fallback
  const CommunityLogo = ({ className = "h-24 sm:h-32" }) => (
    <div className={`flex items-center justify-center bg-white p-3 sm:p-4 rounded-3xl shadow-xl border border-slate-100 ${className}`}>
      {!logoError ? (
        <img 
          src={LOGO_URL} 
          alt="Loharwadha Logo" 
          crossOrigin="anonymous"
          className="h-full w-auto object-contain transition-opacity duration-300"
          onError={() => setLogoError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-emerald-700 opacity-80">
          <Trophy size={48} className="animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest mt-1">Logo Area</p>
        </div>
      )}
    </div>
  );

  const RegistrationDocument = ({ data, id }: { data: RegistrationData, id?: string }) => (
    <div id={id} className="bg-white shadow-2xl border-4 border-slate-100 rounded-lg overflow-hidden w-full max-w-[800px] min-h-[1100px] flex flex-col text-left watermark-container relative" dir={isRTL ? 'rtl' : 'ltr'}>
      <Watermark />
      <div className="relative z-10 flex flex-col flex-1 h-full">
        <div className="bg-emerald-900 text-white p-6 sm:p-10 flex justify-between items-center border-b-8 border-emerald-500">
          <div className="space-y-2">
            <div className="bg-white/10 px-3 py-1 rounded-full inline-block backdrop-blur-md">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-emerald-200">Official Document</p>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">{t.registrationFormTitle}</h1>
            <p className="text-emerald-400 font-bold opacity-80 uppercase text-[10px] sm:text-xs tracking-widest">{t.title} - Youth Cup</p>
          </div>
          <div className="ml-4 shrink-0 bg-white p-1 rounded-xl shadow-lg overflow-hidden">
            <CommunityLogo className="h-16 sm:h-24 p-1 shadow-none border-none rounded-none" />
          </div>
        </div>

        <div className="p-6 sm:p-12 space-y-8 sm:space-y-12 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 bg-slate-50/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Number</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-700">{data.regId}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Issued</p>
              <p className="text-base sm:text-lg font-black text-slate-800">{new Date(data.timestamp).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-6">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.teamName}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 border-b-2 border-emerald-100 pb-2">{data.teamName}</p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.jamatName}</p>
                <p className="text-lg sm:text-xl font-bold text-slate-700">{data.jamatName}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.captainName}</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 border-b-2 border-emerald-100 pb-2">{data.captainName}</p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.viceCaptainName}</p>
                <p className="text-base sm:text-lg font-bold text-slate-700">{data.viceCaptainName}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Users size={18} className="text-emerald-600 sm:w-5 sm:h-5" /> {t.step3}
            </h3>
            <div className="border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border-collapse min-w-[400px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-4 py-3 text-center w-10">#</th>
                      <th className="px-4 py-3 text-left">{t.colName}</th>
                      <th className="px-4 py-3 text-center">{t.colAge}</th>
                      <th className="px-4 py-3 text-left">{t.colPhone}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.players.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-center text-slate-400 font-bold">{p.id}</td>
                        <td className="px-4 py-3 font-black text-slate-800">{p.name || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-600">{p.age || '-'}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{p.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/80 backdrop-blur-sm p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-amber-100 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white">
                <CreditCard size={18} className="sm:w-5 sm:h-5" />
              </div>
              <h4 className="font-black text-amber-900 text-sm sm:text-base">{t.paymentHeading}</h4>
            </div>
            
            <div className="bg-white/80 p-4 sm:p-6 rounded-xl sm:rounded-[1.5rem] border border-amber-200 flex flex-col items-center justify-center text-center space-y-2">
               <p className="text-sm sm:text-base font-black text-amber-900 italic max-w-sm mx-auto leading-tight">
                "{t.paymentInstruction}"
               </p>
              <div className="text-[9px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest">
                {t.paymentDeadlineLabel}: {t.paymentDeadlineDate}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50/80 backdrop-blur-sm p-6 sm:p-10 border-t border-slate-200 flex justify-between items-center mt-auto">
          <div className="space-y-1">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Organized By</p>
            <p className="text-xs sm:text-sm font-black text-slate-800">Loharwadha Committee</p>
          </div>
          <div className="hidden xs:flex gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="w-1 sm:w-1.5 h-8 sm:h-12 bg-slate-200 rounded-full"></div>)}
          </div>
          <div className="text-right">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Stamp</p>
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 sm:border-4 border-emerald-600/20 rounded-full flex items-center justify-center text-emerald-600/20 font-black text-[7px] sm:text-[8px] rotate-12">
              OFFICIAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'font-urdu' : 'font-sans'} bg-slate-50 text-slate-900`} dir={isRTL ? 'rtl' : 'ltr'}>
      <nav className="sticky top-0 z-50 glass shadow-md px-4 sm:px-6 py-4 flex justify-between items-center border-b border-emerald-100 no-print">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setStep('welcome'); resetForm(); }}>
          <div className="bg-emerald-600 p-2 sm:p-2.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
            <Trophy size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-xl sm:text-2xl font-black text-emerald-900 leading-tight tracking-tight">{t.title}</h1>
            <p className="text-[10px] sm:text-xs text-emerald-600 font-bold opacity-75 uppercase tracking-wide">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="flex items-center gap-2 bg-white border border-slate-200 px-3 sm:px-4 py-2 rounded-full hover:bg-slate-50 transition-all text-xs sm:text-sm font-bold text-slate-700 shadow-sm">
            <Globe size={16} className="text-emerald-600 sm:w-[18px] sm:h-[18px]" />
            {lang === 'en' ? 'Urdu' : 'English'}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {step === 'welcome' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="h-64 sm:h-80 bg-[#065F46] flex flex-col items-center justify-center relative overflow-hidden text-center px-4">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <CommunityLogo className="h-32 sm:h-44 shadow-2xl scale-110 sm:scale-125" />
                  <h2 className="text-3xl sm:text-5xl font-black text-white drop-shadow-lg font-urdu px-2 leading-tight">
                    {t.subtitle}
                  </h2>
                </div>
              </div>
              <div className="p-6 sm:p-10 space-y-8 sm:space-y-10">
                <p className="text-lg sm:text-xl text-slate-600 text-center font-medium max-w-2xl mx-auto leading-relaxed italic">
                  "{t.announcement}"
                </p>
                
                <div className="bg-amber-50 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 border border-amber-100 shadow-inner">
                  <h3 className="flex items-center gap-3 font-black text-amber-900 mb-6 sm:mb-8 text-xl sm:text-2xl">
                    <ShieldAlert size={28} className="text-amber-500 sm:w-8 sm:h-8" />
                    {t.terms}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-[350px] sm:h-[400px] overflow-y-auto custom-scrollbar p-1">
                    {t.rules.map((rule, idx) => (
                      <div key={idx} className="bg-white/70 p-4 rounded-xl sm:rounded-2xl border border-amber-200 flex gap-4 items-start transform hover:scale-[1.01] transition-transform">
                        <span className="shrink-0 bg-amber-500 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black text-white shadow-md">
                          {idx + 1}
                        </span>
                        <p className="text-amber-900 text-xs sm:text-sm font-bold leading-relaxed">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6 sm:space-y-8">
                  <h3 className="flex items-center gap-3 font-black text-emerald-900 text-xl sm:text-2xl">
                    <MessageCircle size={28} className="text-emerald-600 sm:w-8 sm:h-8" />
                    {t.contactUs}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {contactList.map((contact, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl sm:rounded-2xl border border-emerald-200 flex justify-between items-center shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] text-emerald-600 font-black uppercase tracking-widest">{contact.name}</p>
                          <p className="text-base sm:text-lg font-black text-slate-800 tracking-tight">{contact.phone}</p>
                        </div>
                        <a href={`tel:${contact.phone}`} className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                          <Phone size={18} className="sm:w-5 sm:h-5" />
                        </a>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 p-2 rounded-lg sm:rounded-xl text-emerald-600">
                        <Mail size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] sm:text-[10px] text-emerald-600 font-black uppercase tracking-widest">{t.contactEmail}</p>
                        <p className="text-xs sm:text-base font-black text-slate-800 break-all">loharwadayouthorganization@gmail.com</p>
                      </div>
                    </div>
                    <button onClick={() => copyToClipboard("loharwadayouthorganization@gmail.com")} className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                      <Copy size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => setStep('form')} className="w-full max-w-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 sm:py-6 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-emerald-200/50 transition-all flex items-center justify-center gap-3 text-xl sm:text-2xl group">
                    <FileText size={24} className="sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
                    {t.start}
                    <ArrowRight size={20} className={`sm:w-6 sm:h-6 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="max-w-full mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col items-center justify-center space-y-6 no-print">
               <CommunityLogo className="h-40 sm:h-48" />
               <div className="flex justify-between items-center px-2 mb-4 w-full max-w-4xl mx-auto">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black transition-all text-sm sm:text-base ${
                      formStep >= num ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-300 border border-slate-200'
                    }`}>
                      {num}
                    </div>
                    <span className={`text-[9px] sm:text-xs font-bold text-center ${formStep >= num ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {t[`step${num}` as keyof typeof t]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-slate-100 min-h-[500px] watermark-container relative overflow-hidden">
              <Watermark />
              <div className="relative z-10">
                {formStep === 1 && (
                  <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-left-4 duration-300 max-w-4xl mx-auto">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                      <Trophy className="text-emerald-600" /> {t.step1}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      <div className="space-y-3">
                        <label className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider">{t.teamName}</label>
                        <input required={restrictionsEnabled} type="text" value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} placeholder="Lohar Tigers" className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none bg-slate-50 font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider">{t.jamatName}</label>
                        <input required={restrictionsEnabled} type="text" value={formData.jamatName} onChange={e => setFormData({...formData, jamatName: e.target.value})} placeholder="Jamat Name" className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none bg-slate-50 font-bold" />
                      </div>
                    </div>
                    <button type="button" onClick={() => setFormStep(2)} className="w-full bg-emerald-600 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl mt-4 flex items-center justify-center gap-2 shadow-lg">
                      {t.next} <ArrowRight size={18} className={`sm:w-5 sm:h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-left-4 duration-300 max-w-4xl mx-auto">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                      <User className="text-emerald-600" /> {t.step2}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs sm:text-sm font-black text-slate-700">{t.captainName}</label>
                          <input required={restrictionsEnabled} type="text" value={formData.captainName} onChange={e => setFormData({...formData, captainName: e.target.value})} className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 font-bold" />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs sm:text-sm font-black text-slate-700">{t.viceCaptainName}</label>
                          <input required={restrictionsEnabled} type="text" value={formData.viceCaptainName} onChange={e => setFormData({...formData, viceCaptainName: e.target.value})} className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 font-bold" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setFormStep(1)} className="flex-1 border border-slate-200 font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl">{t.back}</button>
                      <button type="button" onClick={() => setFormStep(3)} className="flex-[2] bg-emerald-600 text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg">{t.next}</button>
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-left-4 duration-300 w-full">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                      <Users className="text-emerald-600" /> {t.step3}
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="hidden lg:grid grid-cols-[50px_2fr_1fr_1.5fr] gap-4 px-6 py-3 bg-slate-50 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 border border-slate-100">
                        <div>#</div>
                        <div>{t.colName}</div>
                        <div>{t.colAge}</div>
                        <div>{t.colPhone}</div>
                      </div>

                      {formData.players.map((p) => (
                        <div key={p.id} className="lg:grid lg:grid-cols-[50px_2fr_1fr_1.5fr] gap-4 items-center bg-white border border-slate-100 p-4 lg:p-3 rounded-2xl lg:rounded-xl hover:shadow-lg transition-all group relative">
                          <div className="hidden lg:block text-sm font-black text-emerald-600/40 text-center italic">{p.id}</div>
                          <div className="lg:hidden absolute -top-3 -left-3 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-white z-20">
                            {p.id}
                          </div>

                          <div className="space-y-4 lg:space-y-0 lg:contents">
                            <div className="space-y-1 lg:space-y-0">
                              <label className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.colName}</label>
                              <input required={restrictionsEnabled} type="text" value={p.name} onChange={e => handlePlayerChange(p.id, 'name', e.target.value)} placeholder={t.colName} className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                            </div>
                            <div className="space-y-1 lg:space-y-0">
                              <label className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.colAge}</label>
                              <input required={restrictionsEnabled} type="number" value={p.age} onChange={e => handlePlayerChange(p.id, 'age', e.target.value)} placeholder={t.colAge} className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                            </div>
                            <div className="space-y-1 lg:space-y-0">
                              <label className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.colPhone}</label>
                              <input required={restrictionsEnabled} type="tel" value={p.phone} onChange={e => handlePlayerChange(p.id, 'phone', e.target.value)} placeholder="03xx-xxxxxxx" className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4 max-w-4xl mx-auto pt-6">
                      <button type="button" onClick={() => setFormStep(2)} className="flex-1 border border-slate-200 font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl">{t.back}</button>
                      <button type="button" onClick={handleStep3Next} className="flex-[2] bg-emerald-600 text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:bg-emerald-700 transition-colors">
                        {t.next}
                      </button>
                    </div>
                  </div>
                )}

                {formStep === 4 && (
                  <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-left-4 duration-300 max-w-4xl mx-auto">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">
                      <CreditCard className="text-emerald-600" /> {t.step4}
                    </h2>
                    
                    <div className="bg-red-50 border border-red-200 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm animate-pulse-subtle">
                      <div className="bg-red-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white">
                        <CalendarClock size={24} className="sm:w-7 sm:h-7" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-red-900 font-black text-base sm:text-lg">{t.paymentDeadlineLabel}</p>
                        <p className="text-red-600 font-black text-xl sm:text-2xl tracking-tight">{t.paymentDeadlineDate}</p>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white">
                          <Phone size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-emerald-900 text-base sm:text-lg">{t.paymentHeading}</h4>
                          <p className="text-xs sm:text-sm text-emerald-600 font-medium">{t.paymentInstruction}</p>
                        </div>
                      </div>

                      <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-[2rem] border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="bg-emerald-50 p-3 sm:p-4 rounded-full">
                          <ShieldCheck className="text-emerald-600 sm:w-8 sm:h-8" size={28} />
                        </div>
                        <p className="text-base sm:text-lg font-black text-emerald-900 leading-tight italic max-w-xs mx-auto">
                          "{t.paymentInstruction}"
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl flex items-start gap-4 border border-slate-200">
                      <input id="agree" required={restrictionsEnabled} type="checkbox" checked={formData.agreedToTerms} onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})} className="mt-1 w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0" />
                      <label htmlFor="agree" className="text-xs sm:text-sm text-slate-700 cursor-pointer font-bold leading-relaxed">{lang === 'ur' ? 'میں تصدیق کرتا ہوں کہ تمام معلومات درست ہیں اور میں ٹورنامنٹ کے تمام قوانین پر عمل درآمد کا پابند ہوں۔' : 'I confirm all info is correct and I am bound to follow all tournament rules and regulations.'}</label>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setFormStep(3)} className="flex-1 border border-slate-200 font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl">{t.back}</button>
                      <button type="submit" disabled={restrictionsEnabled && !formData.agreedToTerms} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                        <CheckCircle2 size={20} className="sm:w-6 sm:h-6" /> {t.submit}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {step === 'success' && lastSubmittedData && (
          <div className="max-w-4xl mx-auto py-8 sm:py-12 animate-in zoom-in-95 duration-700 text-center space-y-8 sm:space-y-12">
            <div className="space-y-4 px-4">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">{t.successTitle}</h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
                {t.successMsg}
              </p>
            </div>

            <div id="printable-ticket-wrapper" className="flex justify-center px-2 overflow-x-auto custom-scrollbar pb-4">
              <RegistrationDocument data={lastSubmittedData} id="printable-ticket" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center no-print px-4">
              <button 
                onClick={() => { resetForm(); setStep('welcome'); }} 
                className="bg-white border-2 border-slate-200 px-8 py-4 sm:px-10 sm:py-5 rounded-2xl sm:rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all text-lg sm:text-xl"
              >
                {t.returnHome}
              </button>
              <button 
                onClick={() => window.print()} 
                className="bg-emerald-600 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl sm:rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all text-lg sm:text-xl shadow-xl shadow-emerald-200"
              >
                <Printer size={24} /> Print Certificate
              </button>
            </div>

            <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-10 no-print animate-in fade-in slide-in-from-bottom-4 duration-1000 px-4">
              <div className="inline-block bg-emerald-50 px-6 py-4 sm:px-8 sm:py-5 rounded-xl sm:rounded-[2rem] border border-emerald-100 shadow-sm">
                <p className="text-emerald-900 font-black text-lg sm:text-2xl leading-relaxed italic">
                  {t.thankYouNote}
                </p>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {t.orgName}
                </h4>
                <p className="text-emerald-600 font-bold text-lg sm:text-2xl">
                  {t.orgMotto}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'admin' && adminAuth && (
          <div className="animate-in fade-in duration-500 space-y-8 sm:space-y-10 px-2 sm:px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div>
                  <button onClick={() => { setStep('welcome'); resetForm(); }} className="text-emerald-600 flex items-center gap-2 text-xs sm:text-sm font-black mb-2 hover:translate-x-[-4px] transition-all">
                    <ChevronLeft size={16} /> {t.back}
                  </button>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900">{t.adminTitle}</h2>
                    {isSuperAdmin && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                        <Zap size={10} /> Super
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                {isSuperAdmin && (
                  <>
                    <button 
                      onClick={() => setRestrictionsEnabled(!restrictionsEnabled)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black transition-all shadow-xl text-sm sm:text-base ${
                        restrictionsEnabled ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-700 text-white hover:bg-slate-800'
                      }`}
                    >
                      <ShieldQuestion size={20} />
                      {restrictionsEnabled ? 'Restrictions: ON' : 'Restrictions: OFF'}
                    </button>
                    <label className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:bg-purple-700 transition-all shadow-xl text-sm sm:text-base cursor-pointer">
                      <FileUp size={20} /> Import CSV
                      <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                    </label>
                    <button onClick={downloadSampleCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-500 px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm text-sm sm:text-base">
                      Sample Template
                    </button>
                  </>
                )}
                <button onClick={() => { resetForm(); setStep('form'); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl text-sm sm:text-base">
                  <Plus size={20} /> {t.addTeam}
                </button>
                <button onClick={exportToCSV} disabled={registrations.length === 0} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 text-sm sm:text-base">
                  <Download size={20} /> {t.export}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div className="bg-emerald-600 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl text-white">
                <p className="text-emerald-100 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1">{t.totalTeams}</p>
                <p className="text-4xl sm:text-5xl font-black">{registrations.length}</p>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-lg border border-slate-100 relative overflow-hidden group">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-100 w-20 h-20 sm:w-24 sm:h-24 -mr-4 group-focus-within:text-emerald-50 transition-colors" />
                <div className="relative z-10 space-y-1 sm:space-y-2">
                  <label className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest">{t.search}</label>
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Name / Jamat / ID" className="w-full bg-transparent font-bold outline-none text-slate-800 text-base sm:text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left" dir="ltr">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 sm:px-8 sm:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team / Pass</th>
                      <th className="px-6 py-4 sm:px-8 sm:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jamat Info</th>
                      <th className="hidden sm:table-cell px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Leadership</th>
                      <th className="px-6 py-4 sm:px-8 sm:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRegistrations.length === 0 ? (
                      <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">{t.noData}</td></tr>
                    ) : (
                      filteredRegistrations.map((reg) => (
                        <tr key={reg.regId} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-6 py-4 sm:px-8 sm:py-6">
                            <div className="text-[10px] font-black text-emerald-600 mb-0.5">{reg.regId}</div>
                            <div className="text-base sm:text-lg font-black text-slate-800">{reg.teamName}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{new Date(reg.timestamp).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 sm:px-8 sm:py-6">
                            <div className="text-xs sm:text-sm font-bold text-slate-800">{reg.jamatName}</div>
                          </td>
                          <td className="hidden sm:table-cell px-8 py-6">
                            <div className="text-xs font-bold text-slate-800">C: {reg.captainName}</div>
                            <div className="text-xs text-slate-500 font-medium">VC: {reg.viceCaptainName}</div>
                          </td>
                          <td className="px-6 py-4 sm:px-8 sm:py-6">
                            <div className="flex gap-2">
                              <button onClick={() => setViewingReg(reg)} title="View Details" className="p-2 sm:p-3 bg-white border border-slate-100 text-emerald-600 rounded-lg sm:rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Eye size={18} /></button>
                              <button onClick={() => startEdit(reg)} title="Edit" className="p-2 sm:p-3 bg-white border border-slate-100 text-slate-600 rounded-lg sm:rounded-xl hover:bg-slate-600 hover:text-white transition-all shadow-sm"><Edit2 size={18} /></button>
                              <button onClick={() => deleteRegistration(reg.regId)} title="Delete" className="p-2 sm:p-3 bg-white border border-slate-100 text-red-600 rounded-lg sm:rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-8 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl h-[95vh] rounded-2xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
            <div className="bg-emerald-900 p-5 sm:p-8 text-white flex justify-between items-center border-b-8 border-emerald-500 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl overflow-hidden">
                  <CommunityLogo className="h-12 w-12 sm:h-16 sm:w-16 p-1 border-none rounded-none shadow-none" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-300">Team Details</p>
                  <h3 className="text-lg sm:text-2xl font-black tracking-tight">{viewingReg.teamName}</h3>
                </div>
              </div>
              <button onClick={() => setViewingReg(null)} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-2xl transition-all">
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 sm:p-12 space-y-10 sm:space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jamat Info</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{viewingReg.jamatName}</p>
                  </div>
                  <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration ID</p>
                    <p className="text-lg sm:text-xl font-black text-emerald-700">{viewingReg.regId}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{new Date(viewingReg.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Captain</p>
                    <p className="text-lg font-black text-slate-900">{viewingReg.captainName}</p>
                  </div>
                  <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vice Captain</p>
                    <p className="text-lg font-black text-slate-900">{viewingReg.viceCaptainName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg sm:text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Users size={20} className="sm:w-6 sm:h-6 text-emerald-600" /> Team Squad
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {viewingReg.players.map((p) => (
                    <div key={p.id} className="bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 hover:shadow-lg transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-xs sm:text-sm italic">
                          {p.id}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-base sm:text-lg leading-tight">{p.name || "N/A"}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 font-bold">Age: {p.age || "N/A"} • Phone: {p.phone || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-5 sm:p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
               <button onClick={() => deleteRegistration(viewingReg.regId)} className="flex items-center gap-2 text-red-600 font-black hover:bg-red-50 px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm">
                <Trash2 size={18} /> Remove
               </button>
               <button onClick={() => setViewingReg(null)} className="bg-slate-900 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all text-sm sm:text-base">
                Close Viewer
               </button>
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-md rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-600 p-8 sm:p-10 text-center relative">
              <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white"><X size={20} className="sm:w-6 sm:h-6" /></button>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 backdrop-blur-sm rotate-12">
                <Lock size={32} className="text-white sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">{t.loginTitle}</h3>
              <p className="text-emerald-100 text-xs sm:text-sm mt-2 font-medium opacity-80">{t.loginPrompt}</p>
            </div>
            <form onSubmit={handleAdminLogin} className="p-8 sm:p-10 space-y-5 sm:space-y-6">
              <div className="relative">
                <input autoFocus type={showPassword ? "text" : "password"} value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)} placeholder="Access Key" className={`w-full px-5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 ${loginError ? 'border-red-500' : 'border-slate-100'} focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-bold text-sm sm:text-base`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 ${isRTL ? 'left-4' : 'right-4'}`}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-xl transition-all text-sm sm:text-base">
                {t.loginBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="py-12 sm:py-20 bg-white border-t border-slate-100 mt-12 sm:mt-20 no-print">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 sm:space-y-12">
          <div className="space-y-2">
            <Trophy className="mx-auto text-emerald-200 sm:w-12 sm:h-12" size={40} />
            <p className="font-black text-slate-900 text-xl sm:text-2xl">By Order of Committee</p>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Loharwadha Youth Cup 2026</p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 pt-8 sm:pt-10 border-t border-slate-50">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-tighter">Created by Haris Lakhani</p>
            <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 text-[9px] sm:text-xs font-black text-slate-400 hover:text-emerald-600 transition-all uppercase tracking-[0.2em] sm:tracking-[0.3em] group">
              <Lock size={10} className="sm:w-3 sm:h-3 group-hover:rotate-12 transition-transform" />
              {t.loginTitle}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
