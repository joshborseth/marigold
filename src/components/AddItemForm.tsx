import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { centsToDollars } from "@/lib/utils";
import { useInventoryContext } from "@/contexts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["Clothing"] as const;

const CONDITIONS = [
  "New",
  "Like New",
  "Excellent",
  "Good",
  "Fair",
  "Poor",
] as const;

const STATUSES = ["Available", "Sold", "Pending"] as const;

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  condition: z.string().optional(),
  purchasePrice: z.number().optional(),
  sellingPrice: z
    .number({ message: "Selling price is required" })
    .min(0, "Selling price is required")
    .refine((val) => !isNaN(val), { message: "Selling price is required" }),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const AddItemForm = () => {
  const { isDialogOpen, setIsDialogOpen, editingItem, setEditingItem } =
    useInventoryContext();
  const item = editingItem;
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const createItem = useMutation(api.inventory.createItem);
  const updateItem = useMutation(api.inventory.updateItem);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track edit mode when dialog opens to prevent text flashing during close
  const [isEditMode, setIsEditMode] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Clothing" satisfies (typeof CATEGORIES)[number],
      condition: undefined,
      purchasePrice: undefined,
      sellingPrice: undefined,
      quantity: 1,
      status: "Available" satisfies (typeof STATUSES)[number],
      notes: "",
    },
  });

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (isDialogOpen) {
      // Track edit mode when dialog opens to prevent text flashing during close
      // This state persists even if item becomes null during close animation
      setIsEditMode(!!item);

      if (item) {
        // Edit mode - populate form with item data
        form.reset({
          title: item.title,
          description: item.description || "",
          category: item.category,
          condition: item.condition || undefined,
          purchasePrice: item.purchasePrice
            ? centsToDollars(item.purchasePrice)
            : undefined,
          sellingPrice: centsToDollars(item.sellingPrice),
          quantity: item.quantity ?? 1,
          status: item.status,
          notes: item.notes || "",
        });
      } else {
        form.reset();
      }
    }
  }, [isDialogOpen, item, form]);

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && item) {
        await updateItem({
          id: item._id,
          ...values,
        });
      } else {
        await createItem({
          ...values,
        });
      }
      form.reset();
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} item:`,
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingItem(null);
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the item details below."
              : "Add a new item to your inventory. Fill in the details below."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONDITIONS.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value)
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        required
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            field.onChange(NaN);
                          } else {
                            const numValue = parseFloat(value);
                            field.onChange(isNaN(numValue) ? NaN : numValue);
                          }
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        value={field.value ?? 1}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 1
                              : parseInt(e.target.value, 10)
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingItem(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" isSubmitting={isSubmitting}>
                {isEditMode ? "Update Item" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
