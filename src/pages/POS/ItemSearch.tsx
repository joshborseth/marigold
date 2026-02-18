import { useState } from "react";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { centsToDollars } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { usePOSContext } from "@/contexts";

export const ItemSearch = () => {
  const { addItem } = usePOSContext();
  const allItemsQuery = useQuery(api.inventory.getAllItems);
  const allItems = allItemsQuery ?? [];
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = allItems.filter((item) => {
    if (!searchQuery) return true; // Show all items when search is empty
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  const handleAddItem = (item: Doc<"inventoryItems">) => {
    addItem(item);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="mb-4">
      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal bg-white w-[400px]"
          >
            <Search className="mr-2 h-4 w-4" />
            Search items to add...
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by name, SKU, or description..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No items found.</CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item._id}
                    value={`${item.title} ${item.sku}`}
                    onSelect={() => handleAddItem(item)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {item.sku} • $
                        {centsToDollars(item.sellingPrice).toFixed(2)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
