// @ts-nocheck
"use client";
import React, { useState } from "react";
import { Upload, Download, CheckCircle, Loader2, Cloud } from "lucide-react";
import { OrganizationAdminRoute } from "@app/components/organization-admin-route";
import { MultiOrgProvider } from "@app/contexts/multi-org-context";

export default function PWAAssetGenerator() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [formData, setFormData] = useState({
    appName: "My PWA App",
    shortName: "PWA",
    description: "A Progressive Web App",
    backgroundColor: "#ffffff",
    themeColor: "#000000",
    generateSplash: true,
  });
  const [organizationId, setOrganizationId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;

    setLoading(true);
    setUploaded(false);
    try {
      const data = new FormData();
      data.append("logo", file);
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      const response = await fetch("/api/generate-pwa-assets", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (result.success) {
        setGenerated(result);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate PWA assets");
    } finally {
      setLoading(false);
    }
  };

  const downloadIcon = (icon) => {
    const link = document.createElement("a");
    link.href = `data:${icon.mimeType};base64,${icon.data}`;
    link.download = icon.name;
    link.click();
  };

  const downloadManifest = () => {
    const blob = new Blob([JSON.stringify(generated.manifest, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "manifest.json";
    link.click();
  };

  const downloadAll = () => {
    // Download all icons
    generated.assets.icons.forEach((icon) => {
      const link = document.createElement("a");
      link.href = `data:${icon.mimeType};base64,${icon.data}`;
      link.download = icon.name;
      link.click();
    });

    // Download all splash screens
    if (generated.assets.splashScreens) {
      generated.assets.splashScreens.forEach((splash) => {
        const link = document.createElement("a");
        link.href = `data:${splash.mimeType};base64,${splash.data}`;
        link.download = splash.name;
        link.click();
      });
    }

    // Download manifest
    downloadManifest();

    // Download HTML tags as a reference file
    const htmlContent = `<!-- Add these tags to your HTML <head> -->

${Object.values(generated.htmlTags).join("\n")}
`;
    const htmlBlob = new Blob([htmlContent], { type: "text/html" });
    const htmlLink = document.createElement("a");
    htmlLink.href = URL.createObjectURL(htmlBlob);
    htmlLink.download = "html-tags.html";
    htmlLink.click();
  };

  return (
    <MultiOrgProvider>
      <OrganizationAdminRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              PWA Asset Generator
            </h1>
            <p className="text-gray-600 mb-8">
              Upload your logo and generate all required PWA icons and manifest
            </p>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">1. Upload Logo</h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 mx-auto mb-4 object-contain"
                    />
                  ) : (
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  )}
                  <p className="text-sm text-gray-600">
                    {file ? file.name : "Click to upload logo (PNG, JPG, SVG)"}
                  </p>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">2. App Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    App Name
                  </label>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) =>
                      setFormData({ ...formData, appName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Name
                  </label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) =>
                      setFormData({ ...formData, shortName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          backgroundColor: e.target.value,
                        })
                      }
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          backgroundColor: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) =>
                        setFormData({ ...formData, themeColor: e.target.value })
                      }
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.themeColor}
                      onChange={(e) =>
                        setFormData({ ...formData, themeColor: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.generateSplash}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          generateSplash: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Generate iOS splash screens (adds ~15 images)
                    </span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!file || loading}
                className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Generate PWA Assets
                  </>
                )}
              </button>
            </div>

            {generated && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      3. Download or Upload Assets
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {generated.summary.totalIcons} icons +{" "}
                      {generated.summary.totalSplashScreens} splash screens
                    </p>
                  </div>
                  <button
                    onClick={downloadAll}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Icons Section */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      App Icons ({generated.assets.icons.length})
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {generated.summary.maskableIcons} maskable
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {generated.assets.icons.map((icon) => (
                        <div
                          key={icon.name}
                          className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <img
                            src={`data:${icon.mimeType};base64,${icon.data}`}
                            alt={icon.name}
                            className="w-full h-16 object-contain mb-2"
                          />
                          <p className="text-xs text-gray-600 mb-1">
                            {icon.size}x{icon.size}
                          </p>
                          <p className="text-xs text-gray-500 mb-2 truncate">
                            {icon.name}
                          </p>
                          <button
                            onClick={() => downloadIcon(icon)}
                            className="w-full text-xs bg-indigo-100 text-indigo-700 py-1 rounded hover:bg-indigo-200"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Splash Screens Section */}
                  {generated.assets.splashScreens &&
                    generated.assets.splashScreens.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">
                          iOS Splash Screens (
                          {generated.assets.splashScreens.length})
                        </h3>
                        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                          {generated.assets.splashScreens.map((splash) => (
                            <div
                              key={splash.name}
                              className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                            >
                              <img
                                src={`data:${splash.mimeType};base64,${splash.data}`}
                                alt={splash.name}
                                className="w-full h-32 object-contain mb-2"
                              />
                              <p className="text-xs text-gray-600 mb-1">
                                {splash.width}x{splash.height}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {splash.device}
                              </p>
                              <button
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = `data:${splash.mimeType};base64,${splash.data}`;
                                  link.download = splash.name;
                                  link.click();
                                }}
                                className="w-full text-xs bg-indigo-100 text-indigo-700 py-1 rounded hover:bg-indigo-200"
                              >
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Manifest and HTML Tags */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">manifest.json</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                      {JSON.stringify(generated.manifest, null, 2)}
                    </pre>
                    <button
                      onClick={downloadManifest}
                      className="mt-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded hover:bg-indigo-200"
                    >
                      Download Manifest
                    </button>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">HTML Meta Tags</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                      {Object.values(generated.htmlTags).join("\n\n")}
                    </pre>
                    <button
                      onClick={() => {
                        const htmlContent = `<!-- Add these tags to your HTML <head> -->\n\n${Object.values(generated.htmlTags).join("\n")}`;
                        const blob = new Blob([htmlContent], {
                          type: "text/html",
                        });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = "html-tags.html";
                        link.click();
                      }}
                      className="mt-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded hover:bg-indigo-200"
                    >
                      Download HTML
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </OrganizationAdminRoute>
    </MultiOrgProvider>
  );
}
