import * as React from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Row,
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
// ...existing code...
import { AddUserDialog } from "./add-user-dialog";
import { OrganizationMember } from "@app/hooks/use-organization-members";
import { Badge } from "@eq-ex/ui/components/badge";
import { IconGripVertical } from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@eq-ex/ui/components/table";
import { IconTrash } from "@tabler/icons-react";
import { Button } from "@eq-ex/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@eq-ex/ui/components/dialog";
import { removeOrganizationMember } from "@app/data-access/actions/organizations";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { toast } from "sonner";

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <button
      {...attributes}
      {...listeners}
      className="cursor-grab text-muted-foreground px-2 flex items-center justify-center"
      style={{ background: "none", border: "none" }}
      aria-label="Drag to reorder"
    >
      <IconGripVertical className="size-4" />
    </button>
  );
}

function MemberActions({
  member,
  onReload,
}: {
  member: OrganizationMember;
  onReload?: () => void;
}) {
  const { activeOrganization } = useMultiOrgContext();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleRemove() {
    if (!activeOrganization?.id || !member.user_id) return;
    setLoading(true);
    const result = await removeOrganizationMember({
      organization_id: activeOrganization.id,
      user_id: member.user_id,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.message);
    } else {
      toast.success("Member removed successfully");
      setOpen(false);
      if (onReload) onReload();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <IconTrash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {member.name} from the organization?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={loading}
          >
            {loading ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MembersTable({
  members,
  isLoading,
  isError,
  onReload,
}: {
  members: OrganizationMember[];
  isLoading: boolean;
  isError: boolean;
  onReload?: () => void;
}) {
  const columns = React.useMemo<ColumnDef<OrganizationMember>[]>(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) =>
          row.original.user_id ? (
            <DragHandle id={row.original.user_id} />
          ) : null,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const isActive = row.original.is_active;
          return (
            <Badge variant="outline" className="px-1.5 flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
                aria-label={isActive ? "Active" : "Inactive"}
              />
              {row.original.role}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <MemberActions member={row.original} onReload={onReload} />
        ),
      },
    ],
    [onReload]
  );

  const [data, setData] = React.useState(members ?? []);
  React.useEffect(() => {
    setData(members);
  }, [members]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );
  const dataIds = React.useMemo(
    () =>
      data
        ?.map(({ user_id }) => user_id)
        .filter((id): id is string => typeof id === "string" && !!id) || [],
    [data]
  );
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = dataIds.indexOf(active.id as string);
        const newIndex = dataIds.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const updated = [...prev];
        const [moved] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, moved);
        return updated;
      });
    }
  }

  function DraggableRow({ row }: { row: Row<OrganizationMember> }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
      id: row.original.user_id ?? "no-id",
    });
    // If user_id is null, fallback to non-draggable row
    if (!row.original.user_id) {
      return (
        <TableRow>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      );
    }
    return (
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        data-dragging={isDragging}
        ref={setNodeRef}
        className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
        style={{
          transform: CSS.Transform.toString(transform),
          transition: transition,
        }}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
        <h3 className="text-lg font-semibold">Members</h3>
        <AddUserDialog onSuccess={onReload} />
      </div>
      {/* Table and DnD */}
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        id={sortableId}
      >
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-destructive"
                >
                  Error loading members.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              <SortableContext
                items={dataIds}
                strategy={verticalListSortingStrategy}
              >
                {table.getRowModel().rows.map((row) => (
                  <DraggableRow key={row.id} row={row} />
                ))}
              </SortableContext>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}
