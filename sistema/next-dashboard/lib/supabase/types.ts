export type RiskStatus = 'overdue' | 'due-soon' | 'regular';

export type Lot = {
  id: string;
  code: string;
  waste_class: string;
  generator: string;
  manifest: string;
  weight_ton: number;
  destination: string;
  deadline_date: string;
  regularized: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type LotWithRisk = Lot & {
  risk_status: RiskStatus;
  risk_label: string;
};

export type DocumentRow = {
  id: string;
  lot_id: string | null;
  name: string;
  doc_type: string;
  file_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type Database = {
  public: {
    Tables: {
      lots: {
        Row: Lot;
        Insert: Partial<Lot> & {
          code: string;
          waste_class: string;
          generator: string;
          manifest: string;
          weight_ton: number;
          destination: string;
          deadline_date: string;
        };
        Update: Partial<Lot>;
        Relationships: [];
      };
      documents: {
        Row: DocumentRow;
        Insert: Partial<DocumentRow> & {
          name: string;
          doc_type: string;
          file_path: string;
        };
        Update: Partial<DocumentRow>;
        Relationships: [];
      };
    };
    Views: {
      lots_with_risk: {
        Row: LotWithRisk;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
