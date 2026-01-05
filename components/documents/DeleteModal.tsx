import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onConfirm: (id?: string) => void;
  item: string;
  isDeleting?: boolean;
};

export default function ConfirmDelete({
  isOpen,
  item,
  setIsOpen,
  onConfirm,
  isDeleting,
}: Readonly<DeleteProps>) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete</DialogTitle>
          <DialogDescription>{`Are you sure you want to delete ${item}? This action cannot be undone.`}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            disabled={isDeleting}
            onClick={() => setIsOpen(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onConfirm()}
            disabled={isDeleting}
            className="cursor-pointer"
          >
            {isDeleting ? "Deleting..." : "Yes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
