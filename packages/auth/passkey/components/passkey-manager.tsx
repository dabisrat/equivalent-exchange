"use client";

import { useEffect, useState } from "react";
import { Button } from "@eq-ex/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@eq-ex/ui/components/dialog";
import { Fingerprint, Trash2, Loader2 } from "lucide-react";
import { PasskeyRegistration } from "./passkey-registration";
import { listUserPasskeys, deletePasskey } from "../actions/passkey-management";
import { toast } from "sonner";

interface PasskeyCredential {
  id: string;
  credential_id: string;
  device_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] =
    useState<PasskeyCredential | null>(null);

  const loadPasskeys = async () => {
    setIsLoading(true);
    const result = await listUserPasskeys();
    if (result.success) {
      setPasskeys(result.data);
    } else {
      toast.error("Failed to load passkeys");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPasskeys();
  }, []);

  const handleDelete = async () => {
    if (!passkeyToDelete) return;

    setDeletingId(passkeyToDelete.id);
    const result = await deletePasskey(passkeyToDelete.id);
    if (result.success) {
      toast.success("Passkey removed");
      await loadPasskeys();
    } else {
      toast.error("Failed to remove passkey");
    }
    setDeletingId(null);
    setDeleteDialogOpen(false);
    setPasskeyToDelete(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              Manage your passkeys for secure, passwordless sign-in
            </CardDescription>
          </div>
          <PasskeyRegistration onSuccess={loadPasskeys} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Fingerprint className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No passkeys registered yet</p>
            <p className="text-sm mt-1">
              Add a passkey to enable quick and secure sign-in
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {passkey.device_name || "Unnamed passkey"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Added {formatDate(passkey.created_at)}
                      {passkey.last_used_at &&
                        ` • Last used ${formatDate(passkey.last_used_at)}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === passkey.id}
                  onClick={() => {
                    setPasskeyToDelete(passkey);
                    setDeleteDialogOpen(true);
                  }}
                >
                  {deletingId === passkey.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove passkey?</DialogTitle>
              <DialogDescription>
                This will remove &quot;
                {passkeyToDelete?.device_name || "Unnamed passkey"}&quot; from
                your account. You won&apos;t be able to use it to sign in
                anymore.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={!!deletingId}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!!deletingId}
              >
                {deletingId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
