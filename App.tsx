import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";

interface Player {
  name: string;
}

interface Registration {
  id?: string;
  teamName: string;
  captainName: string;
  captainContact: string;
  viceCaptainName: string;
  viceCaptainContact: string;
  alternativeContact: string;
  players: Player[];
  agreedToTerms: boolean;
  regId: string;
  timestamp: string;
}

const App: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [step, setStep] = useState<"form" | "success" | "admin">("form");

  const [formData, setFormData] = useState<Registration>({
    teamName: "",
    captainName: "",
    captainContact: "",
    viceCaptainName: "",
    viceCaptainContact: "",
    alternativeContact: "",
    players: Array.from({ length: 11 }, () => ({ name: "" })),
    agreedToTerms: false,
    regId: "",
    timestamp: ""
  });

  // 🔥 FETCH DATA FROM FIREBASE
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "registrations"));
      const data: Registration[] = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Registration);
      });
      setRegistrations(data);
    };

    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      teamName: "",
      captainName: "",
      captainContact: "",
      viceCaptainName: "",
      viceCaptainContact: "",
      alternativeContact: "",
      players: Array.from({ length: 11 }, () => ({ name: "" })),
      agreedToTerms: false,
      regId: "",
      timestamp: ""
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index?: number
  ) => {
    const { name, value, type, checked } = e.target;

    if (typeof index === "number") {
      const updatedPlayers = [...formData.players];
      updatedPlayers[index].name = value;
      setFormData({ ...formData, players: updatedPlayers });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value
      });
    }
  };

  // 🔥 SAVE TO FIREBASE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPlayersComplete = formData.players.every(
      (p) => p.name.trim() !== ""
    );

    const isContactsComplete =
      formData.captainName &&
      formData.captainContact &&
      formData.viceCaptainName &&
      formData.viceCaptainContact &&
      formData.alternativeContact;

    if (
      formData.teamName &&
      isPlayersComplete &&
      isContactsComplete &&
      formData.agreedToTerms
    ) {
      const newReg = {
        ...formData,
        regId: `LW-${Math.floor(Math.random() * 90000) + 10000}`,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, "registrations"), newReg);

      alert("Registration Submitted Successfully!");
      setStep("success");
      resetForm();
    } else {
      alert("Please complete all required fields.");
    }
  };

  // 🔥 DELETE FROM FIREBASE
  const deleteRegistration = async (id: string) => {
    await deleteDoc(doc(db, "registrations", id));
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Lohar Wadha Cricket Tournament</h1>

      {step === "form" && (
        <form onSubmit={handleSubmit}>
          <input
            name="teamName"
            placeholder="Team Name"
            value={formData.teamName}
            onChange={handleChange}
          />

          <input
            name="captainName"
            placeholder="Captain Name"
            value={formData.captainName}
            onChange={handleChange}
          />

          <input
            name="captainContact"
            placeholder="Captain Contact"
            value={formData.captainContact}
            onChange={handleChange}
          />

          <input
            name="viceCaptainName"
            placeholder="Vice Captain Name"
            value={formData.viceCaptainName}
            onChange={handleChange}
          />

          <input
            name="viceCaptainContact"
            placeholder="Vice Captain Contact"
            value={formData.viceCaptainContact}
            onChange={handleChange}
          />

          <input
            name="alternativeContact"
            placeholder="Alternative Contact"
            value={formData.alternativeContact}
            onChange={handleChange}
          />

          <h3>Players</h3>
          {formData.players.map((player, index) => (
            <input
              key={index}
              placeholder={`Player ${index + 1}`}
              value={player.name}
              onChange={(e) => handleChange(e, index)}
            />
          ))}

          <label>
            <input
              type="checkbox"
              name="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={handleChange}
            />
            Agree to Terms
          </label>

          <button type="submit">Submit</button>
        </form>
      )}

      {step === "admin" && (
        <div>
          <h2>Admin Panel</h2>
          {registrations.map((reg) => (
            <div key={reg.id} style={{ border: "1px solid gray", margin: 10 }}>
              <p><strong>Team:</strong> {reg.teamName}</p>
              <p><strong>Captain:</strong> {reg.captainName}</p>
              <p><strong>Reg ID:</strong> {reg.regId}</p>
              <button onClick={() => deleteRegistration(reg.id!)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
