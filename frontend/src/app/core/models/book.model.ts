export type BookStatus = 'Available' | 'Issued';

export interface Book {
  id: string;
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
  queueNumber: number;
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
}

export interface BorrowBookRequest {
  userId: string;
  bookId: string;
}

export interface ReturnBookRequest {
  historyId: number;
  bookId: string;
}

export interface ReserveBookRequest {
  bookId: string;
  queueNumber: number;
}
