import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());

const allowedOrigins = [
  "https://dresserp-frontend.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function(origin, callback) {

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true
}));

app.options("*", cors());


// TEST ROUTE
app.get("/", (req, res) => {
  res.json({ message: "Backend working" });
});


// CRITICAL PART FOR RAILWAY
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});