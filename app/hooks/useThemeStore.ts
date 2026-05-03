import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

function getInitialTheme(): Theme {
	if (typeof window === "undefined") return "light";
	const stored = localStorage.getItem("theme");
	if (stored === "dark" || stored === "light") return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export const useThemeStore = create<ThemeState>((set, get) => ({
	theme: getInitialTheme(),
	setTheme: (theme) => {
		document.documentElement.setAttribute("data-mode", theme);
		localStorage.setItem("theme", theme);
		set({ theme });
	},
	toggleTheme: () => {
		const next = get().theme === "dark" ? "light" : "dark";
		get().setTheme(next);
	},
}));
