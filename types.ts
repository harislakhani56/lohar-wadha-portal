
export type Language = 'en' | 'ur';

export interface Player {
  id: number;
  name: string;
  age: string;
  phone: string;
  cnic: string;
  cnicImage?: string; // base64 string
}

export interface RegistrationData {
  regId: string;
  timestamp: string;
  teamName: string;
  jamatName: string;
  captainName: string;
  viceCaptainName: string;
  players: Player[];
  agreedToTerms: boolean;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
