import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";
export type ActiveTheme = "light" | "dark";

interface ThemeState {
	themePreference: ThemePreference;
	activeTheme: ActiveTheme;
	setThemePreference: (pref: ThemePreference) => void;
	toggleTheme: () => void;
	syncActiveTheme: () => void;
}

function getSystemTheme(): ActiveTheme {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialPreference(): ThemePreference {
	if (typeof window === "undefined") return "system";
	const stored = localStorage.getItem("themeMode") as ThemePreference;
	if (stored === "dark" || stored === "light" || stored === "system") return stored;
	
	// Fallback for old "theme" key migration
	const oldStored = localStorage.getItem("theme");
	if (oldStored === "dark" || oldStored === "light") {
		localStorage.setItem("themeMode", oldStored);
		return oldStored as ThemePreference;
	}
	
	return "system";
}

export const useThemeStore = create<ThemeState>((set, get) => {
	const initialPref = getInitialPreference();
	const initialActive = initialPref === "system" ? getSystemTheme() : initialPref;

	return {
		themePreference: initialPref,
		activeTheme: initialActive,
		
		setThemePreference: (pref) => {
			if (typeof window !== "undefined") {
				localStorage.setItem("themeMode", pref);
			}
			set({ themePreference: pref });
			get().syncActiveTheme();
		},
		
		syncActiveTheme: () => {
			const { themePreference } = get();
			const active = themePreference === "system" ? getSystemTheme() : themePreference;
			if (typeof window !== "undefined") {
				document.documentElement.setAttribute("data-mode", active);
			}
			set({ activeTheme: active });
		},
		
		toggleTheme: () => {
			const currentActive = get().activeTheme;
			const nextActive = currentActive === "dark" ? "light" : "dark";
			// Toggling acts as a manual override, strictly setting light or dark
			get().setThemePreference(nextActive);
		},
	};
});

// Setup auto-sync listener
if (typeof window !== "undefined") {
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
		// Only sync if user prefers system theme
		if (useThemeStore.getState().themePreference === "system") {
			useThemeStore.getState().syncActiveTheme();
		}
	});
}
