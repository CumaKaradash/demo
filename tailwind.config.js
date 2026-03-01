/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      colors: {
        border: "hsl(214, 32%, 85%)",
        background: "#f8fafc",
        foreground: "#0f172a",
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#f9fafb"
        },
        muted: {
          DEFAULT: "#e2e8f0",
          foreground: "#64748b"
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a"
        }
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem"
      }
    }
  },
  plugins: []
};
