"use client";
import { Button } from "@eq-ex/ui/components/button";
import { Card, CardContent } from "@eq-ex/ui/components/card";

type SubdomainErrorPageProps = {
  error: "NOT_FOUND" | "INACTIVE" | "DATABASE_ERROR" | "INVALID_SUBDOMAIN";
  subdomain: string;
  message: string;
};

function getErrorIcon(error: SubdomainErrorPageProps["error"]) {
  switch (error) {
    case "NOT_FOUND":
      return <div className="h-12 w-12 text-4xl">❌</div>;
    case "INACTIVE":
      return <div className="h-12 w-12 text-4xl">⚠️</div>;
    case "DATABASE_ERROR":
      return <div className="h-12 w-12 text-4xl">🔄</div>;
    case "INVALID_SUBDOMAIN":
      return <div className="h-12 w-12 text-4xl">❌</div>;
    default:
      return <div className="h-12 w-12 text-4xl">❓</div>;
  }
}

function getErrorTitle(error: SubdomainErrorPageProps["error"]) {
  switch (error) {
    case "NOT_FOUND":
      return "Organization Not Found";
    case "INACTIVE":
      return "Organization Unavailable";
    case "DATABASE_ERROR":
      return "Service Temporarily Unavailable";
    case "INVALID_SUBDOMAIN":
      return "Invalid Subdomain";
    default:
      return "Error";
  }
}

function ErrorActions({
  error,
  subdomain,
}: {
  error: SubdomainErrorPageProps["error"];
  subdomain: string;
}) {
  const handleRetry = () => {
    window.location.reload();
  };

  const goToMainSite = () => {
    // Remove subdomain and go to main domain
    const currentUrl = new URL(window.location.href);
    currentUrl.hostname = currentUrl.hostname.split(".").slice(-2).join(".");
    window.location.href = currentUrl.hostname;
  };

  return (
    <div className="space-y-3">
      <Button onClick={goToMainSite} className="w-full" size="lg">
        🏠 Go to Main Site
      </Button>

      {error === "DATABASE_ERROR" && (
        <Button
          onClick={handleRetry}
          variant="outline"
          className="w-full"
          size="lg"
        >
          🔄 Try Again
        </Button>
      )}

      {error === "INACTIVE" && (
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => window.open("mailto:support@yourdomain.com", "_blank")}
        >
          📧 Contact Support
        </Button>
      )}
    </div>
  );
}

function getHelpText(error: SubdomainErrorPageProps["error"]) {
  switch (error) {
    case "NOT_FOUND":
      return "The organization you're looking for doesn't exist. Please check the subdomain spelling or contact the organization directly.";
    case "INACTIVE":
      return "This organization is temporarily unavailable. This could be due to maintenance, account suspension, or other administrative reasons.";
    case "DATABASE_ERROR":
      return "We're experiencing technical difficulties. Please try refreshing the page or come back in a few minutes.";
    case "INVALID_SUBDOMAIN":
      return "The subdomain format is invalid. Subdomains must be 3-50 characters long and contain only letters, numbers, and hyphens.";
    default:
      return "An unexpected error occurred.";
  }
}

export function SubdomainErrorPage({
  error,
  subdomain,
  message,
}: SubdomainErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">{getErrorIcon(error)}</div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getErrorTitle(error)}
              </h1>

              {/* Error Message */}
              <p className="text-gray-600 dark:text-gray-400">{message}</p>

              {/* Subdomain Display */}
              {subdomain && subdomain !== "www" && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
                    {subdomain}.yourdomain.com
                  </span>
                </div>
              )}

              {/* Help Text */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getHelpText(error)}
              </p>

              {/* Action Buttons */}
              <ErrorActions error={error} subdomain={subdomain} />

              {/* Additional Help */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Need help? Contact us at{" "}
                  <a
                    href="mailto:support@yourdomain.com"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    support@yourdomain.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
