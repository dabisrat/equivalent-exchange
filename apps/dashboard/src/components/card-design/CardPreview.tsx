"use client";

import { OrganizationCardConfig } from "@eq-ex/shared/schemas/card-config";

interface CardPreviewProps {
  config: Partial<OrganizationCardConfig>;
  primaryColor?: string | null;
  maxPoints: number;
  logoUrl?: string | null;
  formData?: any; // Current form values for live preview
}

export function CardPreview({
  config,
  primaryColor,
  maxPoints,
  logoUrl,
  formData,
}: CardPreviewProps) {
  // Mock card dimensions (iPhone-like)
  const cardWidth = 300;
  const cardHeight = 180;

  // Use fallbacks
  const brandColor = formData?.primary_color || primaryColor || "#000000";
  const currentMaxPoints = formData?.max_points || maxPoints;
  const logo = logoUrl;

  // Extract config with defaults, overridden by formData
  const frontConfig = {
    ...config.card_front_config,
    company_name:
      formData?.company_name || config.card_front_config?.company_name || "",
    offer_description:
      formData?.offer_description ||
      config.card_front_config?.offer_description ||
      "",
    website_link:
      formData?.front_website_link ||
      config.card_front_config?.website_link ||
      "",
  };
  const backConfig = {
    ...config.card_back_config,
    website_link:
      formData?.back_website_link ||
      config.card_back_config?.website_link ||
      "",
    description:
      formData?.description || config.card_back_config?.description || "",
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-medium">Preview</h3>

      {/* Phone mock */}
      <div
        className="relative border-4 border-gray-800 rounded-3xl bg-black p-2"
        style={{ width: cardWidth + 20, height: cardHeight + 40 }}
      >
        {/* Screen */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ width: cardWidth, height: cardHeight }}
        >
          {/* Front Card */}
          <div className="h-full p-4 flex flex-col">
            {/* Header with logo */}
            <div className="flex items-center justify-between mb-4">
              {logo && (
                <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
              )}
              <div className="text-sm font-bold" style={{ color: brandColor }}>
                {frontConfig.company_name || "Company Name"}
              </div>
            </div>

            {/* Offer */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">
                  {frontConfig.offer_description || "Buy 9 Get 1 Free"}
                </div>
                {frontConfig.website_link && (
                  <div className="text-sm text-gray-600">
                    {frontConfig.website_link}
                  </div>
                )}
              </div>
            </div>

            {/* Stamp grid placeholder */}
            <div className="flex justify-center space-x-2 mt-4">
              {Array.from({ length: currentMaxPoints }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs`}
                  style={{
                    borderColor: brandColor,
                    backgroundColor: i < 5 ? brandColor : "transparent",
                    color: i < 5 ? "white" : brandColor,
                  }}
                >
                  {i < 5 ? "✓" : "○"}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notch */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-gray-800 rounded-b-xl"></div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        This is a preview of how your card will appear on mobile devices.
        Changes are saved automatically.
      </p>
    </div>
  );
}
