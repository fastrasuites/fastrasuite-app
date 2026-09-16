declare module "@teclone/industries" {
  export interface Industry {
    id: number;
    linkedinId: number;
    name: string;
  }

  export const industries: Industry[];
}
