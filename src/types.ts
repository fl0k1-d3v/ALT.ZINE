export type Note = {
  id: string;
  text: string;
  updatedAt: number;
};

export type Book = {
  id: string;
  title: string;
  content: string;
  segments: string[];
  currentSegment: number;
  totalSegments: number;
  lastRead: number;
};

export type PageType =
  | 'HOME'
  | 'Books List'
  | 'Current Book'
  | 'Upload Book'
  | 'Notes List'
  | 'New Note'
  | 'Last Note'
  | 'Settings Page'
  | 'Created By Fl0k1'
  | 'Theme Settings'
  | 'Edit Note'
  | 'Reader';

export interface AppState {
  currentPage: PageType | 'HOME';
  notes: Note[];
  books: Book[];
  currentBookId: string | null;
  selectedItemIndex: number;
  editor: {
    id: string | null;
    text: string;
    initialText: string;
  };
}
