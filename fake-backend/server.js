const jsonServer = require("json-server");
const auth = require("json-server-auth");
const app = jsonServer.create();
const router = jsonServer.router("./db.json");

app.db = router.db;
const middlewares = jsonServer.defaults();

// 1. Core Middlewares (Crucial: bodyParser must come first to read req.body)
app.use(middlewares);
app.use(jsonServer.bodyParser);

// 2. Custom ID Generation Middleware
app.use((req, res, next) => {
  if (req.method === "POST" && req.url === "/register") {
    const { role, userClass } = req.body;
    if (!role) {
      return res.status(400).json({
        error: "Missing 'role' field required for user registration.",
      });
    }

    const db = app.db;
    const systemState = db.get("systemState").value() || [];

    // Track or initialize registration sequence
    let tracker = systemState.find((item) => item.id === "userTracker");
    if (!tracker) {
      tracker = { id: "userTracker", lastSequence: 0 };
      db.get("systemState").push(tracker).write();
    }

    const nextSequence = tracker.lastSequence + 1;

    // Save updated sequence to db.json
    db.get("systemState")
      .find({ id: "userTracker" })
      .assign({ lastSequence: nextSequence })
      .write();

    // Map Prefixes (Librarian -> A, Student/User -> U)
    const rolePrefix = ["user", "librarian"].includes(role.toLowerCase()) ? "U" : "A";
    const cleanClass = userClass ? String(userClass).toUpperCase() : "A";
    const classPrefix = ["A", "B", "C", "D"].includes(cleanClass) ? cleanClass : "A";
    const sequenceString = String(nextSequence).padStart(6, "0");

    // Inject generated alphanumeric custom ID into auth payload
    req.body.id = `${rolePrefix}${classPrefix}${sequenceString}`;
    
    // Clean temporary UI layouts
    delete req.body.userClass;
  }

  if (req.method === "POST" && req.url === "/book") {
    const db = app.db;
    const systemState = db.get("systemState").value() || [];

    let tracker = systemState.find((item) => item.id === "booksTracker");
    if (!tracker) {
      tracker = { id: "booksTracker", lastSequence: 0 };
      db.get("systemState").push(tracker).write();
    }

    const nextSequence = tracker.lastSequence + 1;

    db.get("systemState")
      .find({ id: "booksTracker" })
      .assign({ lastSequence: nextSequence })
      .write();

    const sequenceString = String(nextSequence).padStart(6, "0");
    req.body.id = `BK-${sequenceString}`;
  }

  next();
});

// 3. Rules & Standard Routes (Pass rules mapping to json-server-auth)
app.use(auth);
app.use(router);

app.listen(3000, () => {
  console.log("Fake backend running on port 3000");
});
