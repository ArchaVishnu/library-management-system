const jsonServer = require("json-server");
const auth = require("json-server-auth");
const app = jsonServer.create();
const router = jsonServer.router("./db.json");
app.db = router.db;

// 1. Body parser FIRST — before everything
app.use(jsonServer.bodyParser);

// 2. Default middlewares (logger, static, cors) — after bodyParser
const middlewares = jsonServer.defaults();
app.use(middlewares);

// 3. Custom middleware — body is now reliably parsed
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
    let tracker = systemState.find((item) => item.id === "userTracker");

    if (!tracker) {
      tracker = { id: "userTracker", lastSequence: 0 };
      db.get("systemState").push(tracker).write();
    }

    const nextSequence = tracker.lastSequence + 1;
    db.get("systemState")
      .find({ id: "userTracker" })
      .assign({ lastSequence: nextSequence })
      .write();

    const rolePrefix = ['user'].includes(role.toLowerCase()) ? "U" : "A";
    const cleanClass = userClass ? String(userClass).toUpperCase() : "A";
    const classPrefix = ["A", "B", "C", "D"].includes(cleanClass) ? cleanClass : "A";
    const sequenceString = String(nextSequence).padStart(6, "0");

    req.body.id = `${rolePrefix}${classPrefix}${sequenceString}`;
    delete req.body.userClass;
  }

  // ✅ Fixed: "books" not "book"
  if (req.method === "POST" && req.url === "/books") {
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

    req.body.id = `BK-${String(nextSequence).padStart(6, "0")}`;
  }

  next();
});

// 4. Auth and router last
app.use(auth);
app.use(router);

app.listen(3000, () => {
  console.log("Fake backend running on port 3000");
});