export interface PunchNodeConfig {
  id: string;
  name: string;
  type: "standard" | "special" | "bonus";
  size: {
    punched: "small" | "medium" | "large";
    unpunched: "small" | "medium" | "large";
    loading?: "small" | "medium" | "large";
  };
  colors: {
    punched: string;
    unpunched: string;
    loading?: string;
  };
  icons: {
    punched: string; // Icon name from react-icons
    unpunched: string;
    loading?: string;
  };
  animation?: {
    enabled: boolean;
    loading?: {
      type: "spin" | "pulse" | "bounce" | "flip" | "ping";
      duration?: number;
    };
    punched?: {
      type: "spin" | "pulse" | "bounce" | "flip" | "ping";
      duration?: number;
    };
    unpunched?: {
      type: "spin" | "pulse" | "bounce" | "flip" | "ping";
      duration?: number;
    };
  };
  points?: number; // Optional point value override
}
