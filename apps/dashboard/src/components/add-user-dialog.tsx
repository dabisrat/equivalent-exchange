import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@eq-ex/ui/components/dialog";
import { addOrganizationMember } from "../utils/organization";
import { toast } from "sonner";

export function AddUserDialog({ onSuccess }: { onSuccess?: () => void }) {
  const { activeOrganization: organization } = useMultiOrgContext();
  const organization_id = organization?.id ?? "";
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("member");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !name) {
      setError("Email and name are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: apiError, status } = await addOrganizationMember({
        email,
        name,
        role,
        organization_id,
      });

      if (apiError) {
        setError(apiError.message || "Failed to add user.");
        setLoading(false);
        return;
      }

      // Show appropriate success notification based on status
      if (status === "invited") {
        toast.success("Invitation sent!", {
          description: `${email} has been invited and should check their email to join the organization.`,
        });
      } else if (status === "added") {
        toast.success("Member added!", {
          description: `${email} has been added to the organization.`,
        });
      }

      setOpen(false);
      setEmail("");
      setName("");
      setRole("member");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-primary/90">
          Add User
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Invite a new member to your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="add-user-email"
              className="block text-sm font-medium mb-1"
            >
              Email
            </label>
            <input
              id="add-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border px-2 py-1 text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="add-user-name"
              className="block text-sm font-medium mb-1"
            >
              Name
            </label>
            <input
              id="add-user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border px-2 py-1 text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="add-user-role"
              className="block text-sm font-medium mb-1"
            >
              Role
            </label>
            <select
              id="add-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded border px-2 py-1 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
          {error && <div className="text-destructive text-sm">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded bg-primary px-3 py-2 text-sm font-medium text-white shadow hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              className="flex-1 rounded bg-muted px-3 py-2 text-sm font-medium"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
