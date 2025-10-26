export interface Theme {
  name: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderLight: string;
    accent400: string;
    accent500: string;
    accent600: string;
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    danger: string;
    dangerBg: string;
    info: string;
    infoBg: string;
  };
}

export const themes: Record<string, Theme> = {
  gruvbox: {
    name: "Gruvbox Dark",
    colors: {
      bgPrimary: "#282828",
      bgSecondary: "#3c3836",
      bgTertiary: "#504945",
      textPrimary: "#ebdbb2",
      textSecondary: "#d5c4a1",
      textTertiary: "#bdae93",
      border: "#504945",
      borderLight: "#665c54",
      accent400: "#8ec07c",
      accent500: "#689d6a",
      accent600: "#528757",
      success: "#b8bb26",
      successBg: "rgba(184, 187, 38, 0.15)",
      warning: "#fabd2f",
      warningBg: "rgba(250, 189, 47, 0.15)",
      danger: "#fb4934",
      dangerBg: "rgba(251, 73, 52, 0.15)",
      info: "#83a598",
      infoBg: "rgba(131, 165, 152, 0.15)",
    },
  },
  nord: {
    name: "Nord",
    colors: {
      bgPrimary: "#2e3440",
      bgSecondary: "#3b4252",
      bgTertiary: "#434c5e",
      textPrimary: "#eceff4",
      textSecondary: "#e5e9f0",
      textTertiary: "#d8dee9",
      border: "#4c566a",
      borderLight: "#5e6b82",
      accent400: "#88c0d0",
      accent500: "#81a1c1",
      accent600: "#5e81ac",
      success: "#a3be8c",
      successBg: "rgba(163, 190, 140, 0.15)",
      warning: "#ebcb8b",
      warningBg: "rgba(235, 203, 139, 0.15)",
      danger: "#bf616a",
      dangerBg: "rgba(191, 97, 106, 0.15)",
      info: "#88c0d0",
      infoBg: "rgba(136, 192, 208, 0.15)",
    },
  },
  dracula: {
    name: "Dracula",
    colors: {
      bgPrimary: "#282a36",
      bgSecondary: "#343746",
      bgTertiary: "#44475a",
      textPrimary: "#f8f8f2",
      textSecondary: "#e6e6e0",
      textTertiary: "#bfbfb5",
      border: "#44475a",
      borderLight: "#6272a4",
      accent400: "#bd93f9",
      accent500: "#9580f0",
      accent600: "#7d6ee8",
      success: "#50fa7b",
      successBg: "rgba(80, 250, 123, 0.15)",
      warning: "#f1fa8c",
      warningBg: "rgba(241, 250, 140, 0.15)",
      danger: "#ff5555",
      dangerBg: "rgba(255, 85, 85, 0.15)",
      info: "#8be9fd",
      infoBg: "rgba(139, 233, 253, 0.15)",
    },
  },
  catppuccin: {
    name: "Catppuccin Mocha",
    colors: {
      bgPrimary: "#1e1e2e",
      bgSecondary: "#313244",
      bgTertiary: "#45475a",
      textPrimary: "#cdd6f4",
      textSecondary: "#bac2de",
      textTertiary: "#a6adc8",
      border: "#45475a",
      borderLight: "#585b70",
      accent400: "#89b4fa",
      accent500: "#74a6f0",
      accent600: "#6096e8",
      success: "#a6e3a1",
      successBg: "rgba(166, 227, 161, 0.15)",
      warning: "#f9e2af",
      warningBg: "rgba(249, 226, 175, 0.15)",
      danger: "#f38ba8",
      dangerBg: "rgba(243, 139, 168, 0.15)",
      info: "#89dceb",
      infoBg: "rgba(137, 220, 235, 0.15)",
    },
  },
  "tokyo-night": {
    name: "Tokyo Night",
    colors: {
      bgPrimary: "#1a1b26",
      bgSecondary: "#24283b",
      bgTertiary: "#414868",
      textPrimary: "#c0caf5",
      textSecondary: "#a9b1d6",
      textTertiary: "#9aa5ce",
      border: "#414868",
      borderLight: "#545c7e",
      accent400: "#7aa2f7",
      accent500: "#668de0",
      accent600: "#5c7dd0",
      success: "#9ece6a",
      successBg: "rgba(158, 206, 106, 0.15)",
      warning: "#e0af68",
      warningBg: "rgba(224, 175, 104, 0.15)",
      danger: "#f7768e",
      dangerBg: "rgba(247, 118, 142, 0.15)",
      info: "#7dcfff",
      infoBg: "rgba(125, 207, 255, 0.15)",
    },
  },
  "one-dark": {
    name: "One Dark",
    colors: {
      bgPrimary: "#282c34",
      bgSecondary: "#2c313c",
      bgTertiary: "#3e4451",
      textPrimary: "#abb2bf",
      textSecondary: "#9da5b4",
      textTertiary: "#7f848e",
      border: "#3e4451",
      borderLight: "#4b5263",
      accent400: "#61afef",
      accent500: "#528bff",
      accent600: "#4078f2",
      success: "#98c379",
      successBg: "rgba(152, 195, 121, 0.15)",
      warning: "#e5c07b",
      warningBg: "rgba(229, 192, 123, 0.15)",
      danger: "#e06c75",
      dangerBg: "rgba(224, 108, 117, 0.15)",
      info: "#61afef",
      infoBg: "rgba(97, 175, 239, 0.15)",
    },
  },
  "solarized-dark": {
    name: "Solarized Dark",
    colors: {
      bgPrimary: "#002b36",
      bgSecondary: "#073642",
      bgTertiary: "#586e75",
      textPrimary: "#fdf6e3",
      textSecondary: "#eee8d5",
      textTertiary: "#93a1a1",
      border: "#073642",
      borderLight: "#586e75",
      accent400: "#2aa198",
      accent500: "#268bd2",
      accent600: "#1d76b8",
      success: "#859900",
      successBg: "rgba(133, 153, 0, 0.15)",
      warning: "#b58900",
      warningBg: "rgba(181, 137, 0, 0.15)",
      danger: "#dc322f",
      dangerBg: "rgba(220, 50, 47, 0.15)",
      info: "#268bd2",
      infoBg: "rgba(38, 139, 210, 0.15)",
    },
  },
  "material-darker": {
    name: "Material Darker",
    colors: {
      bgPrimary: "#212121",
      bgSecondary: "#2a2a2a",
      bgTertiary: "#353535",
      textPrimary: "#eeffff",
      textSecondary: "#b0bec5",
      textTertiary: "#90a4ae",
      border: "#353535",
      borderLight: "#424242",
      accent400: "#82aaff",
      accent500: "#6e9ce8",
      accent600: "#5a8bd0",
      success: "#c3e88d",
      successBg: "rgba(195, 232, 141, 0.15)",
      warning: "#ffcb6b",
      warningBg: "rgba(255, 203, 107, 0.15)",
      danger: "#f07178",
      dangerBg: "rgba(240, 113, 120, 0.15)",
      info: "#89ddff",
      infoBg: "rgba(137, 221, 255, 0.15)",
    },
  },
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  root.style.setProperty("--color-bg-primary", theme.colors.bgPrimary);
  root.style.setProperty("--color-bg-secondary", theme.colors.bgSecondary);
  root.style.setProperty("--color-bg-tertiary", theme.colors.bgTertiary);
  root.style.setProperty("--color-text-primary", theme.colors.textPrimary);
  root.style.setProperty("--color-text-secondary", theme.colors.textSecondary);
  root.style.setProperty("--color-text-tertiary", theme.colors.textTertiary);
  root.style.setProperty("--color-border", theme.colors.border);
  root.style.setProperty("--color-border-light", theme.colors.borderLight);
  root.style.setProperty("--color-accent-400", theme.colors.accent400);
  root.style.setProperty("--color-accent-500", theme.colors.accent500);
  root.style.setProperty("--color-accent-600", theme.colors.accent600);
  root.style.setProperty("--color-success", theme.colors.success);
  root.style.setProperty("--color-success-bg", theme.colors.successBg);
  root.style.setProperty("--color-warning", theme.colors.warning);
  root.style.setProperty("--color-warning-bg", theme.colors.warningBg);
  root.style.setProperty("--color-danger", theme.colors.danger);
  root.style.setProperty("--color-danger-bg", theme.colors.dangerBg);
  root.style.setProperty("--color-info", theme.colors.info);
  root.style.setProperty("--color-info-bg", theme.colors.infoBg);
};

