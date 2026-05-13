import { HttpResponse, HttpParams, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, concatMap, map } from 'rxjs';
import {
  BookQueryOptions,
  Book,
  BorrowHistory,
  Reservation,
  BookStatus,
  AddBooksModel,
  BorrowBookRequest,
  ReturnBookRequest,
  ReserveBookRequest,
} from '../models/book.model';
import { APP_ENVIRONMENT } from '../tokens/env.tokens';

@Injectable({
  providedIn: 'root',
})
export class BooksService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);
  private readonly baseUrl = this.env.apiBaseUrl;

  /**
   * Fetches paginated and filtered book entries complete with response metadata headers
   */
  public getBooks(
    options: BookQueryOptions = {},
  ): Observable<HttpResponse<Book[]>> {
    let params = new HttpParams();
    if (options.page) params = params.set('_page', String(options.page));
    if (options.limit) params = params.set('_limit', String(options.limit));
    if (options.search) params = params.set('q', options.search);
    if (options.status) params = params.set('status', options.status);

    return this.http.get<Book[]>(`${this.baseUrl}/books`, {
      params,
      observe: 'response', // Cleanly preserves headers like X-Total-Count
    });
  }

  /**
   * Registers a new book asset profile in the library database
   */
  public addBook(data: AddBooksModel): Observable<Book> {
    const body = { ...data, status: 'Available' as BookStatus };
    return this.http.post<Book>(`${this.baseUrl}/book`, body);
  }

  /**
   *  Borrows a book safely using sequential mapping
   * Updates the asset state FIRST, and only writes to history if that step succeeds.
   */
  public executeBorrowTransaction(
    data: BorrowBookRequest,
  ): Observable<BorrowHistory> {
    const startDate: string = new Date().toISOString().split('T')[0]; // "2026-05-13"
    const parsedDate: Date = new Date(startDate);
    parsedDate.setDate(parsedDate.getDate() + 7);
    const dueDate: string = parsedDate.toISOString().split('T')[0];

    const logPayload = {
      ...data,
      borrowDate: startDate,
      returnDate: dueDate,
    };

    // Step 1: Patch the book status
    return this.http
      .patch<Book>(`${this.baseUrl}/books/${data.bookId}`, {
        status: 'Issued' as BookStatus,
      })
      .pipe(
        // Step 2: Switch context to the history log stream seamlessly
        concatMap(() =>
          this.http.post<BorrowHistory>(
            `${this.baseUrl}/borrowHistory`,
            logPayload,
          ),
        ),
      );
  }

  /**
   *  Processes returns safely
   * Ensures the asset is marked as available and completes the tracking record.
   */
  public returnBook(data: ReturnBookRequest): Observable<BorrowHistory> {
    const returnDateString = new Date().toISOString().split('T')[0];

    // Step 1: Reset book asset status to Available
    return this.http
      .patch<Book>(`${this.baseUrl}/books/${data.bookId}`, {
        status: 'Available' as BookStatus,
      })
      .pipe(
        // Step 2: Finalize timestamps on the transaction ledger entry
        concatMap(() =>
          this.http.patch<BorrowHistory>(
            `${this.baseUrl}/borrowHistory/${data.historyId}`,
            { returnDate: returnDateString },
          ),
        ),
      );
  }

  /**
   * Submits a reservation request queue item
   */
  public reserveBook(data: ReserveBookRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations`, data);
  }
}

