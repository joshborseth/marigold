import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Link2 } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";
import { toast } from "sonner";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import squareLogo from "@/assets/square_logo.svg";

export default function Integrations() {
  const [searchParams] = useSearchParams();
  const squareIntegration = useQuery(api.squareOAuth.getSquareIntegration);
  const getSquareAuthUrl = useQuery(api.squareOAuth.getSquareAuthUrl);
  const disconnectSquare = useMutation(api.squareOAuth.disconnectSquare);

  // Show success/error toast if redirected from OAuth callback
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast.success("Square account connected successfully!");
      // Remove the query parameter from URL
      window.history.replaceState({}, "", "/integrations");
    }

    const error = searchParams.get("error");
    const errorMessage = searchParams.get("message");
    if (error) {
      if (error === "sandbox_account") {
        toast.error("Sandbox Test Account Required", {
          description:
            errorMessage ||
            "Please launch the seller test account from the Square Developer Console first.",
          duration: 10000,
        });
      } else {
        toast.error(`Square Authorization Error: ${error}`, {
          description: errorMessage,
          duration: 8000,
        });
      }
      // Remove the query parameters from URL
      window.history.replaceState({}, "", "/integrations");
    }
  }, [searchParams]);

  const handleConnectSquare = () => {
    if (getSquareAuthUrl?.authUrl) {
      console.log("Redirecting to Square OAuth:", getSquareAuthUrl.authUrl);
      window.location.href = getSquareAuthUrl.authUrl;
    } else {
      toast.error("Unable to generate Square authorization URL");
      console.error("getSquareAuthUrl is:", getSquareAuthUrl);
    }
  };

  const handleDisconnectSquare = async () => {
    try {
      await disconnectSquare();
      toast.success("Square account disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Square account");
      console.error("Disconnect error:", error);
    }
  };

  return (
    <PageWrapper
      title="Integrations"
      description="Connect your accounts to enable additional features"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <img src={squareLogo} alt="Square" className="h-6 w-auto" />
                  Square
                </CardTitle>
                <CardDescription className="mt-2">
                  Connect your Square account to process payments and manage
                  terminals
                </CardDescription>
              </div>
              {squareIntegration?.connected && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {squareIntegration === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : getSquareAuthUrl === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : squareIntegration === null ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Connect your Square account to enable:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Process payments through Square Terminal</li>
                    <li>View and manage connected terminals</li>
                    <li>Track payment transactions</li>
                  </ul>
                </div>
                <div className="text-sm bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    ⚠️ Sandbox Environment Required
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                    Before connecting, you must launch the seller test account
                    from the{" "}
                    <a
                      href="https://developer.squareup.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Square Developer Console
                    </a>
                    . Go to your app → <strong>Test Accounts</strong> →{" "}
                    <strong>Launch Test Account</strong>.
                  </p>
                </div>
                <Button
                  onClick={handleConnectSquare}
                  disabled={!getSquareAuthUrl?.authUrl}
                  className="w-full sm:w-auto"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Square Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={
                        squareIntegration.isExpired ? "destructive" : "default"
                      }
                      className="flex items-center gap-1"
                    >
                      {squareIntegration.isExpired ? (
                        <>
                          <XCircle className="h-3 w-3" />
                          Expired
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </>
                      )}
                    </Badge>
                  </div>
                  {squareIntegration.merchantId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Merchant ID:
                      </span>
                      <span className="font-mono text-xs">
                        {squareIntegration.merchantId}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Environment:</span>
                    <Badge variant="outline">
                      {squareIntegration.environment === "production"
                        ? "Production"
                        : "Sandbox"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connected:</span>
                    <span>
                      {new Date(
                        squareIntegration.connectedAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {squareIntegration.isExpired ? (
                    <Button
                      onClick={handleConnectSquare}
                      disabled={!getSquareAuthUrl}
                      className="flex-1"
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      Reconnect Account
                    </Button>
                  ) : null}
                  <Button
                    onClick={handleDisconnectSquare}
                    variant="outline"
                    className="flex-1"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
