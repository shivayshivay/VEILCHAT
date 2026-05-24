/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        card: "#111827",
        primary: "#00F5D4",
        "primary-fg": "#0A0A0A",
        surface: "#111827",
        secondary: "#1F2937",
        muted: "#1F2937",
        "muted-fg": "#6B7280",
        border: "#1F2937",
        fg: "#E5E7EB",
        destructive: "#EF4444",
        online: "#10B981",
      },
      fontFamily: {
        regular: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
