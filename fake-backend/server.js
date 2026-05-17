const jsonServer = require("json-server");
const auth = require("json-server-auth");

const app = jsonServer.create();
const router = jsonServer.router("./db.json");

app.db = router.db;

app.use(jsonServer.bodyParser);

app.use(
  jsonServer.defaults({
    noCors: false,
  }),
);

// Expose X-Total-Count to Angular when observe: 'response' is used.
app.use((req, res, next) => {
  res.header("Access-Control-Expose-Headers", "X-Total-Count");
  next();
});

const VALID_BOOK_STATUSES = ["Available", "Issued", "Reserved"];
const VALID_RETURN_STATUSES = ["Active", "Overdue", "Returned"];

function sendError(res, status, message, details = undefined) {
  return res.status(status).json({
    error: message,
    ...(details ? { details } : {}),
  });
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function getCollection(name) {
  return app.db.get(name);
}

function getArray(name) {
  return getCollection(name).value() || [];
}

function nextNumericId(collectionName) {
  const items = getArray(collectionName);
  const maxId = items.reduce((max, item) => {
    const numericId = Number(item.id);
    return Number.isFinite(numericId) && numericId > max ? numericId : max;
  }, 0);

  return maxId + 1;
}

function nextSequence(trackerId) {
  const db = app.db;
  const systemState = db.get("systemState").value() || [];

  let tracker = systemState.find((item) => item.id === trackerId);

  if (!tracker) {
    tracker = { id: trackerId, lastSequence: 0 };
    db.get("systemState").push(tracker).write();
  }

  const value = Number(tracker.lastSequence || 0) + 1;

  db.get("systemState")
    .find({ id: trackerId })
    .assign({ lastSequence: value })
    .write();

  return value;
}

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();

  if (["admin", "librarian"].includes(value)) return "admin";
  if (["user", "student"].includes(value)) return "user";

  return value;
}

function findUserByIdentifier(identifier) {
  const value = String(identifier);

  return getArray("users").find(
    (user) =>
      String(user.id) === value ||
      String(user.libraryCardId) === value ||
      String(user.libraryCardId) === value,
  );
}

function findBookByIdentifier(identifier) {
  const value = String(identifier);

  return getArray("books").find(
    (book) => String(book.id) === value || String(book.bookId) === value,
  );
}

function updateBook(bookIdOrId, patch) {
  const book = findBookByIdentifier(bookIdOrId);

  if (!book) return null;

  getCollection("books").find({ id: book.id }).assign(patch).write();

  return findBookByIdentifier(book.id);
}

function sanitizeUser(user) {
  if (!user) return user;

  const { password, ...safeUser } = user;

  return safeUser;
}

function validateRequiredFields(body, fields) {
  return fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
}

/**
 * Registration pre-processor.
 *
 * json-server-auth will handle:
 * - bcrypt hashing
 * - writing user to db
 * - returning { accessToken, user }
 *
 * This middleware only adds:
 * - numeric id
 * - libraryCardId
 * - devPlainPassword
 * - role normalization
 */
app.use((req, res, next) => {
  const isRegisterRequest =
    req.method === "POST" &&
    ["/register", "/signup", "/users"].includes(req.path);

  if (!isRegisterRequest) {
    return next();
  }

  const missingFields = validateRequiredFields(req.body, [
    "email",
    "password",
    "name",
    "role",
  ]);

  if (missingFields.length) {
    return sendError(
      res,
      400,
      `Missing required field(s): ${missingFields.join(", ")}`,
    );
  }

  const existingUser = getArray("users").find(
    (user) => String(user.email).toLowerCase() === String(req.body.email).toLowerCase(),
  );

  if (existingUser) {
    return sendError(res, 409, "A user with this email already exists.");
  }

  const normalizedRole = normalizeRole(req.body.role);

  if (!["user", "admin"].includes(normalizedRole)) {
    return sendError(res, 400, "Role must be either 'user' or 'admin'.");
  }

  const userClass = String(req.body.userClass || "A").toUpperCase();
  const classPrefix = ["A", "B", "C", "D"].includes(userClass) ? userClass : "A";
  const rolePrefix = normalizedRole === "admin" ? "A" : "U";
  const sequence = nextSequence("userTracker");

  const libraryCardId = `${rolePrefix}${classPrefix}${String(sequence).padStart(
    6,
    "0",
  )}`;

  req.body.id = nextNumericId("users");
  req.body.role = normalizedRole;
  req.body.libraryCardId = libraryCardId;

  // Alias for your current typo in user.model.ts: libraryCardId
  req.body.libraryCardId = libraryCardId;

  // Local development only. Remove this before production/sharing.
  req.body.devPlainPassword = req.body.password;

  delete req.body.userClass;

  next();
});

/**
 * Let json-server-auth handle:
 * POST /login
 * POST /register
 * JWT accessToken generation
 * bcrypt password comparison
 */
app.use(auth);

/**
 * GET /books
 *
 * Supports:
 * /books
 * /books?_page=1&_limit=10
 * /books?q=clean
 * /books?status=Available
 */
app.get("/books", (req, res) => {
  const { q, search, status, _page, _limit } = req.query;

  let books = [...getArray("books")];

  const searchText = String(q || search || "").trim().toLowerCase();

  if (searchText) {
    books = books.filter((book) => {
      return [
        book.bookId,
        book.title,
        book.author,
        book.isbn,
        Array.isArray(book.genre) ? book.genre.join(" ") : book.genre,
        book.status,
        book.publishedYear,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText));
    });
  }

  if (status) {
    books = books.filter(
      (book) => String(book.status).toLowerCase() === String(status).toLowerCase(),
    );
  }

  const totalCount = books.length;

  const page = Number(_page);
  const limit = Number(_limit);

  if (Number.isFinite(page) && Number.isFinite(limit) && page > 0 && limit > 0) {
    const start = (page - 1) * limit;
    const end = start + limit;
    books = books.slice(start, end);
  }

  res.setHeader("X-Total-Count", String(totalCount));

  return res.status(200).json(books);
});

/**
 * GET /books/:id
 *
 * Supports both:
 * /books/1
 * /books/BK-000001
 */
app.get("/books/:id", (req, res) => {
  const book = findBookByIdentifier(req.params.id);

  if (!book) {
    return sendError(res, 404, "Book not found.");
  }

  return res.status(200).json(book);
});

/**
 * POST /book and POST /books
 *
 * Your Angular service currently calls POST /book.
 * This also supports POST /books for consistency.
 */
function createBookHandler(req, res) {
  const missingFields = validateRequiredFields(req.body, [
    "title",
    "author",
    "isbn",
  ]);

  if (missingFields.length) {
    return sendError(
      res,
      400,
      `Missing required field(s): ${missingFields.join(", ")}`,
    );
  }

  const existingBook = getArray("books").find(
    (book) => String(book.isbn).toLowerCase() === String(req.body.isbn).toLowerCase(),
  );

  if (existingBook) {
    return sendError(res, 409, "A book with this ISBN already exists.");
  }

  const sequence = nextSequence("booksTracker");

  const book = {
    id: nextNumericId("books"),
    bookId: `BK-${String(sequence).padStart(6, "0")}`,
    title: req.body.title,
    author: req.body.author,
    isbn: req.body.isbn,
    status: "Available",
    genre: req.body.genre || [],
    publishedYear: req.body.publishedYear || null,
  };

  getCollection("books").push(book).write();

  return res.status(201).json(book);
}

app.post("/book", createBookHandler);
app.post("/books", createBookHandler);

/**
 * PATCH /books/:id
 *
 * Supports:
 * PATCH /books/1
 * PATCH /books/BK-000001
 */
app.patch("/books/:id", (req, res) => {
  const book = findBookByIdentifier(req.params.id);

  if (!book) {
    return sendError(res, 404, "Book not found.");
  }

  if (
    req.body.status &&
    !VALID_BOOK_STATUSES.includes(String(req.body.status))
  ) {
    return sendError(
      res,
      400,
      `Invalid book status. Use one of: ${VALID_BOOK_STATUSES.join(", ")}`,
    );
  }

  const protectedFields = ["id", "bookId"];
  const patch = { ...req.body };

  protectedFields.forEach((field) => delete patch[field]);

  const updatedBook = updateBook(book.id, patch);

  return res.status(200).json(updatedBook);
});

/**
 * POST /borrowHistory
 *
 * This supports your existing Angular flow:
 * 1. PATCH /books/:bookId
 * 2. POST /borrowHistory
 *
 * It also safely updates the book to Issued here, so the DB stays correct.
 */
app.post("/borrowHistory", (req, res) => {
  const missingFields = validateRequiredFields(req.body, ["userId", "bookId"]);

  if (missingFields.length) {
    return sendError(
      res,
      400,
      `Missing required field(s): ${missingFields.join(", ")}`,
    );
  }

  const user = findUserByIdentifier(req.body.userId);
  const book = findBookByIdentifier(req.body.bookId);

  if (!user) {
    return sendError(res, 404, "User not found.");
  }

  if (!book) {
    return sendError(res, 404, "Book not found.");
  }

  const activeBorrow = getArray("borrowHistory").find(
    (entry) =>
      String(entry.bookId) === String(book.bookId) &&
      ["Active", "Overdue"].includes(entry.status) &&
      !entry.returnDate,
  );

  if (activeBorrow) {
    return sendError(res, 409, "This book is already borrowed.");
  }

  const borrowDate = req.body.borrowDate || todayString();
  const dueDate = req.body.dueDate || addDays(borrowDate, 7);

  const historyEntry = {
    id: nextNumericId("borrowHistory"),
    userId: user.libraryCardId || user.libraryCardId || String(user.id),
    bookId: book.bookId,
    borrowDate,
    returnDate: null,
    dueDate,
    status: "Active",
  };

  updateBook(book.id, { status: "Issued" });
  getCollection("borrowHistory").push(historyEntry).write();

  return res.status(201).json(historyEntry);
});

/**
 * Optional single-call borrow endpoint.
 *
 * You can later update Angular to call POST /borrow instead of doing
 * PATCH /books/:id followed by POST /borrowHistory.
 */
app.post("/borrow", (req, res) => {
  req.url = "/borrowHistory";
  return app._router.handle(req, res);
});

/**
 * PATCH /borrowHistory/:id
 *
 * Used when returning a book if Angular sends:
 * PATCH /borrowHistory/:historyId
 */
app.patch("/borrowHistory/:id", (req, res) => {
  const historyId = Number(req.params.id);

  if (!Number.isFinite(historyId)) {
    return sendError(res, 400, "Invalid borrow history id.");
  }

  const history = getArray("borrowHistory").find(
    (entry) => Number(entry.id) === historyId,
  );

  if (!history) {
    return sendError(res, 404, "Borrow history record not found.");
  }

  const patch = { ...req.body };

  if (patch.status && !VALID_RETURN_STATUSES.includes(String(patch.status))) {
    return sendError(
      res,
      400,
      `Invalid return status. Use one of: ${VALID_RETURN_STATUSES.join(", ")}`,
    );
  }

  if (patch.returnDate || patch.status === "Returned") {
    patch.returnDate = patch.returnDate || todayString();
    patch.status = "Returned";

    updateBook(history.bookId, { status: "Available" });
  }

  getCollection("borrowHistory")
    .find({ id: history.id })
    .assign(patch)
    .write();

  const updatedHistory = getArray("borrowHistory").find(
    (entry) => Number(entry.id) === historyId,
  );

  return res.status(200).json(updatedHistory);
});

/**
 * POST /returnBook
 *
 * Supports returning without knowing historyId.
 *
 * Body:
 * {
 *   "userId": "UA000002",
 *   "bookId": "BK-000002"
 * }
 */
app.post("/returnBook", (req, res) => {
  const missingFields = validateRequiredFields(req.body, ["userId", "bookId"]);

  if (missingFields.length) {
    return sendError(
      res,
      400,
      `Missing required field(s): ${missingFields.join(", ")}`,
    );
  }

  const user = findUserByIdentifier(req.body.userId);
  const book = findBookByIdentifier(req.body.bookId);

  if (!user) {
    return sendError(res, 404, "User not found.");
  }

  if (!book) {
    return sendError(res, 404, "Book not found.");
  }

  const userLibraryId = user.libraryCardId || user.libraryCardId || String(user.id);

  const history = getArray("borrowHistory").find(
    (entry) =>
      String(entry.userId) === String(userLibraryId) &&
      String(entry.bookId) === String(book.bookId) &&
      ["Active", "Overdue"].includes(entry.status) &&
      !entry.returnDate,
  );

  if (!history) {
    return sendError(res, 404, "No active borrow record found for this user/book.");
  }

  const patch = {
    returnDate: todayString(),
    status: "Returned",
  };

  getCollection("borrowHistory")
    .find({ id: history.id })
    .assign(patch)
    .write();

  updateBook(book.id, { status: "Available" });

  const updatedHistory = getArray("borrowHistory").find(
    (entry) => Number(entry.id) === Number(history.id),
  );

  return res.status(200).json(updatedHistory);
});

/**
 * POST /reservations
 */
app.post("/reservations", (req, res) => {
  const missingFields = validateRequiredFields(req.body, ["userId", "bookId"]);

  if (missingFields.length) {
    return sendError(
      res,
      400,
      `Missing required field(s): ${missingFields.join(", ")}`,
    );
  }

  const user = findUserByIdentifier(req.body.userId);
  const book = findBookByIdentifier(req.body.bookId);

  if (!user) {
    return sendError(res, 404, "User not found.");
  }

  if (!book) {
    return sendError(res, 404, "Book not found.");
  }

  const userLibraryId = user.libraryCardId || user.libraryCardId || String(user.id);

  const existingReservation = getArray("reservations").find(
    (reservation) =>
      String(reservation.userId) === String(userLibraryId) &&
      String(reservation.bookId) === String(book.bookId),
  );

  if (existingReservation) {
    return sendError(res, 409, "This user has already reserved this book.");
  }

  const reservationsForBook = getArray("reservations").filter(
    (reservation) => String(reservation.bookId) === String(book.bookId),
  );

  const maxQueueNumber = reservationsForBook.reduce((max, reservation) => {
    const queueNumber = Number(reservation.queueNumber);
    return Number.isFinite(queueNumber) && queueNumber > max ? queueNumber : max;
  }, 0);

  const reservation = {
    id: nextNumericId("reservations"),
    userId: userLibraryId,
    bookId: book.bookId,
    queueNumber: maxQueueNumber + 1,
    reservedDate: req.body.reservedDate || todayString(),
  };

  getCollection("reservations").push(reservation).write();

  if (book.status === "Available") {
    updateBook(book.id, { status: "Reserved" });
  }

  return res.status(201).json(reservation);
});

/**
 * DELETE /reservations/:id
 */
app.delete("/reservations/:id", (req, res) => {
  const reservationId = Number(req.params.id);

  if (!Number.isFinite(reservationId)) {
    return sendError(res, 400, "Invalid reservation id.");
  }

  const reservation = getArray("reservations").find(
    (item) => Number(item.id) === reservationId,
  );

  if (!reservation) {
    return sendError(res, 404, "Reservation not found.");
  }

  getCollection("reservations").remove({ id: reservation.id }).write();

  const remainingForBook = getArray("reservations")
    .filter((item) => String(item.bookId) === String(reservation.bookId))
    .sort((a, b) => Number(a.queueNumber) - Number(b.queueNumber));

  remainingForBook.forEach((item, index) => {
    getCollection("reservations")
      .find({ id: item.id })
      .assign({ queueNumber: index + 1 })
      .write();
  });

  const book = findBookByIdentifier(reservation.bookId);
  const hasMoreReservations = remainingForBook.length > 0;

  if (book && book.status === "Reserved" && !hasMoreReservations) {
    updateBook(book.id, { status: "Available" });
  }

  return res.status(200).json({
    message: "Reservation deleted successfully.",
    reservation,
  });
});

/**
 * Safe user list without password.
 */
app.get("/safeUsers", (req, res) => {
  const users = getArray("users").map(sanitizeUser);
  return res.status(200).json(users);
});

/**
 * Fallback json-server routes.
 *
 * This keeps normal GET/PATCH/DELETE behavior for routes not handled above.
 */
app.use(router);

app.listen(3000, () => {
  console.log("Fake backend running on port 3000");
});