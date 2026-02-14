import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { db, auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import { Language, RegistrationData, Player, Message } from "./types";
import { getTournamentAssistance } from "./geminiService";

/* ------------------ COMPONENT ------------------ */

const App: React.FC = () => {

  /* ---------------- AUTH ---------------- */

  const [adminAuth, setAdminAuth] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setAdminAuth(true);
      else setAdminAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      setStep("admin");
      setAdminEmail("");
      setAdminPassword("");
    } catch (error) {
      alert("Invalid email or password");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setStep("welcome");
  };

  /* ---------------- GENERAL STATE ---------------- */

  const [lang, setLang] = useState<Language>("ur");
  const [step, setStep] = useState<
    "welcome" | "form" | "success" | "admin" | "login"
  >("welcome");

  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [editingRegId, setEditingRegId] = useState<string | null>(null);

  const [formData, setFormData] = useState<
    Omit<RegistrationData, "regId" | "timestamp">
  >({
    teamName: "",
    captainName: "",
    captainContact: "",
    viceCaptainName: "",
    viceCaptainContact: "",
    alternativeContact: "",
    players: Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      name: ""
    })),
    teamType: "non-jamaati",
    agreedToTerms: false
  });

  /* ---------------- FIRESTORE ---------------- */

  const fetchRegistrations = async () => {
    const snapshot = await getDocs(collection(db, "registrations"));
    const data = snapshot.docs.map((docItem) => ({
      regId: docItem.id,
      ...docItem.data()
    })) as RegistrationData[];
    setRegistrations(data.reverse());
  };

  useEffect(() => {
    if (adminAuth) fetchRegistrations();
  }, [adminAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPlayersComplete = formData.players.every(
      (p) => p.name.trim() !== ""
    );

    if (!isPlayersComplete || !formData.teamName.trim()) {
      alert("Complete all fields");
      return;
    }

    try {
      if (editingRegId) {
        await updateDoc(doc(db, "registrations", editingRegId), {
          ...formData,
          timestamp: new Date().toISOString()
        });
      } else {
        const q = query(
          collection(db, "registrations"),
          where("teamName", "==", formData.teamName.trim())
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          alert("Team name already registered");
          return;
        }

        await addDoc(collection(db, "registrations"), {
          ...formData,
          timestamp: new Date().toISOString()
        });
      }

      setStep("success");
      setEditingRegId(null);
      resetForm();
      if (adminAuth) fetchRegistrations();
    } catch (error) {
      alert("Error saving data");
    }
  };

  const deleteRegistration = async (id: string) => {
    await deleteDoc(doc(db, "registrations", id));
    fetchRegistrations();
  };

  const resetForm = () => {
    setFormData({
      teamName: "",
      captainName: "",
      captainContact: "",
      viceCaptainName: "",
      viceCaptainContact: "",
      alternativeContact: "",
      players: Array.from({ length: 11 }, (_, i) => ({
        id: i + 1,
        name: ""
      })),
      teamType: "non-jamaati",
      agreedToTerms: false
    });
  };

  /* ---------------- UI ---------------- */

  if (step === "login") {
    return (
      <div className="flex items-center justify-center h-screen">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow-xl w-80 space-y-4"
        >
          <h2 className="text-xl font-bold text-center">
            Admin Login
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />

          <button className="w-full bg-emerald-600 text-white py-2 rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Lohar Wadha Tournament
        </h1>

        <div className="flex gap-3">
          {!adminAuth ? (
            <button
              onClick={() => setStep("login")}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              Admin Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* WELCOME */}
      {step === "welcome" && (
        <div className="text-center">
          <button
            onClick={() => setStep("form")}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl"
          >
            Register Team
          </button>
        </div>
      )}

      {/* FORM */}
      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <input
            required
            type="text"
            placeholder="Team Name"
            value={formData.teamName}
            onChange={(e) =>
              setFormData({ ...formData, teamName: e.target.value })
            }
            className="w-full border px-3 py-2 rounded"
          />

          {formData.players.map((p) => (
            <input
              key={p.id}
              required
              type="text"
              placeholder={`Player ${p.id}`}
              value={p.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  players: formData.players.map((pl) =>
                    pl.id === p.id
                      ? { ...pl, name: e.target.value }
                      : pl
                  )
                })
              }
              className="w-full border px-3 py-2 rounded"
            />
          ))}

          <button className="bg-emerald-600 text-white px-4 py-2 rounded">
            Submit
          </button>
        </form>
      )}

      {/* SUCCESS */}
      {step === "success" && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-emerald-600">
            Registration Successful
          </h2>
          <button
            onClick={() => setStep("welcome")}
            className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
          >
            Back Home
          </button>
        </div>
      )}

      {/* ADMIN PANEL */}
      {step === "admin" && adminAuth && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            Admin Dashboard
          </h2>

          {registrations.map((reg) => (
            <div
              key={reg.regId}
              className="border p-3 rounded mb-3 flex justify-between"
            >
              <div>
                <p className="font-bold">{reg.teamName}</p>
                <p className="text-sm text-gray-500">
                  {reg.timestamp}
                </p>
              </div>

              <button
                onClick={() =>
                  deleteRegistration(reg.regId)
                }
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
