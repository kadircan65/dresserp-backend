import cors from "cors";

// TÜM VERCEL DOMAINLERİNİ ve localhost'u izin ver
const corsOptions = {
  origin: function (origin, callback) {

    // origin yoksa izin ver (Postman vs)
    if (!origin) return callback(null, true);

    // localhost izinli
    if (origin.includes("localhost")) {
      return callback(null, true);
    }

    // tüm vercel.app domainlerini izinli yap
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // railway frontend varsa
    if (origin.endsWith(".railway.app")) {
      return callback(null, true);
    }

    // diğerlerini reddet
    return callback(new Error("CORS blocked: " + origin));
  },

  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));