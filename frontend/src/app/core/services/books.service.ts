import { HttpResponse, HttpParams, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BookQueryOptions, Book, BorrowHistory, Reservation } from '../models/book';
import { BookStatus } from '../models/book.model';

@Injectable({
  providedIn: 'root',
})
export class BooksService {
  constructor(private http:HttpClient){}

  private readonly baseUrl = 'http://localhost:3000';
  public getBooks(
    options: BookQueryOptions = {},
  ): Observable<HttpResponse<Book[]>> {
    let params = new HttpParams();

    if (options.page) params = params.set('_page', String(options.page));
    if (options.limit) params = params.set('_limit', String(options.limit));
    if (options.search) params = params.set('q', options.search);
    if (options.status) params = params.set('status', options.status);

    return this.http.get<Book[]>(`${this.baseUrl}/books`, {
      headers: this.getAuthHeaders(),
      params,
      observe: 'response', // Required to extract X-Total-Count metadata headers safely
    });
  }
  getAuthHeaders(): import("@angular/common/http").HttpHeaders | Record<string, string | string[]> | undefined {
    throw new Error('Method not implemented.');
  }

  /**
   * 3. Operational Transactions (Issue, Reserve, and Return)
   */
  public addBook(
    title: string,
    author: string,
    isbn: string = 'any',
  ): Observable<Book> {
    const body = { title, author, isbn, status: 'Available' as BookStatus };
    return this.http.post<Book>(`${this.baseUrl}/book`, body, {
      headers: this.getAuthHeaders(),
    });
  }

  public borrowBook(userId: string, bookId: number): Observable<BorrowHistory> {
    // Pipeline Chain Part A: Flip book status to Issued
    return this.http
      .patch<Book>(
        `${this.baseUrl}/books/${bookId}`,
        { status: 'Issued' as BookStatus },
        { headers: this.getAuthHeaders() },
      )
      .pipe(
        tap(() => {}),
        // Pipeline Chain Part B: Log into the History ledger
        tap({
          next: () => {
            const logPayload = {
              userId,
              bookId,
              borrowDate: new Date().toISOString().split('T')[0],
              returnDate: null,
            };
            return this.http.post<BorrowHistory>(
              `${this.baseUrl}/borrowHistory`,
              logPayload,
              { headers: this.getAuthHeaders() },
            );
          },
        }),
        // Switch map or sequential mapping can be implemented down-stream inside the calling component
      ) as unknown as Observable<BorrowHistory>;
    // Note: To execute sequentially over explicit HTTP, flat mapping from component side is cleaner:
  }

  /**
   * Alternate Safe Sequence Wrapper for Borrowing to avoid loose streams:
   */
  public executeBorrowTransaction(
    userId: string,
    bookId: number,
  ): Observable<BorrowHistory> {
    const logPayload = {
      userId,
      bookId,
      borrowDate: new Date().toISOString().split('T')[0],
      returnDate: null,
    };

    // First, update book status
    this.http
      .patch<Book>(
        `${this.baseUrl}/books/${bookId}`,
        { status: 'Issued' },
        { headers: this.getAuthHeaders() },
      )
      .subscribe();
    // Then return record payload stream
    return this.http.post<BorrowHistory>(
      `${this.baseUrl}/borrowHistory`,
      logPayload,
      { headers: this.getAuthHeaders() },
    );
  }

  /**
   * THE RETURN BOOK FLOW
   * Sets book status to 'Available' and adds a returnDate to the transaction record
   */
  public returnBook(
    historyId: number,
    bookId: number,
  ): Observable<BorrowHistory> {
    const returnDateString = new Date().toISOString().split('T')[0];

    // 1. Update the Book asset profile to mark it as Available again
    this.http
      .patch<Book>(
        `${this.baseUrl}/books/${bookId}`,
        { status: 'Available' as BookStatus },
        { headers: this.getAuthHeaders() },
      )
      .subscribe();

    // 2. Patch the borrow tracking entity with completion timestamps
    return this.http.patch<BorrowHistory>(
      `${this.baseUrl}/borrowHistory/${historyId}`,
      { returnDate: returnDateString },
      { headers: this.getAuthHeaders() },
    );
  }

  public reserveBook(
    bookId: number,
    queueNumber: number,
  ): Observable<Reservation> {
    return this.http.post<Reservation>(
      `${this.baseUrl}/reservations`,
      { book: String(bookId), queueNumber },
      { headers: this.getAuthHeaders() },
    );
  }

}
