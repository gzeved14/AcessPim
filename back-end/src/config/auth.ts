export const authConfig = {
  jwt: {
    secret: process.env.JWT_ACCESS_SECRET, // (cite: 258)
    expiresIn: "8h", // Requisito RF01 (cite: 196)
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET, // (cite: 258)
    expiresIn: "7d",
  },
  bcryptSalt: 10, // Costuma ser usado para o hash de senhas (cite: 243)
};