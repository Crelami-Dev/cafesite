export interface PeminatanTrack {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  practiceHours: string;
  capstone: string;
  subjects: string[];
  outcome: string;
}

export interface CampusSpace {
  id: string;
  code: string;
  title: string;
  image: string;
  alt: string;
  capacityMetric: string;
  description: string;
  details: string[];
}

export interface AdmissionWave {
  id: string;
  name: string;
  period: string;
  seatsLeft: number;
  totalSeats: number;
  monthlyTuition: string;
  entryFee: string;
  requirements: string[];
  note: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

