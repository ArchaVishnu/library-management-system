import { BookStatus } from "./book.type";

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  status: BookStatus;
}

export interface BorrowHistory {
  id: number;
  userId: string;
  bookId: number;
  borrowDate: string;
  returnDate: string | null;
}

export interface Reservation {
  id?: number;
  book: string;
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