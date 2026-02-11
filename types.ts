
export type Language = 'en' | 'ur';

export interface Player {
  id: number;
  name: string;
}

export interface RegistrationData {
  regId: string;
  timestamp: string;
  teamName: string;
  captainName: string;
  captainContact: string;
  viceCaptainName: string;
  viceCaptainContact: string;
  alternativeContact: string;
  players: Player[];
  teamType: 'jamaati' | 'non-jamaati';
  agreedToTerms: boolean;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
