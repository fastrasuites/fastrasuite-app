export type Activity = {
  id: string;
  sn: string;
  name: string;
  quantity: number;
  rate: number;
  budget: number;
  [key: string]: any;
};

export type Phase = {
  id: string;
  name: string;
  activities: Activity[];
};

