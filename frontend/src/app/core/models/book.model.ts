export type BookStatus = 'Available' | 'Issued';
export type ReturnStatus = 'Active' | 'Overdue' | 'Returned';

export interface Book {
  id: string;
  bookId: string;
  title: string;
  author: string;
  isbn: string;
  status: BookStatus;
}

export interface BorrowHistory {
  id: number;
  userId: string;
  bookId: string;
  borrowDate: string;
  returnDate: string | null;
  dueDate: string;
}

export interface Reservation {
  id?: number;
  bookId: string;
  userId: string;
  queueNumber: number;
  reservedDate: string;
}

export interface BookQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: BookStatus;
}

export interface PaginatedBooksResponse {
  data: Book[];
  totalCount: string | null;
}
export interface AddBooksModel {
  title: string;
  author: string;
  isbn: string;
  status: string;
  genre: string[],
  publishedYear: number;
}

export interface BorrowBookRequest {
  userId: string;
  bookId: string;
  borrowDate: string;
  returnDate: string | null;
  dueDate: string;
  status: ReturnStatus;
}

export interface ReturnBookRequest {
  // historyId: number;
  userId: string;
  bookId: string;
}

export interface ReserveBookRequest {
  bookId: string;
  queueNumber: number;
  userId: string;
  reservedDate: string;
}
