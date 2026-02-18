import { useEffect, useState, useRef, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Monitor } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { usePOSContext } from "@/contexts";

export const DeviceSelector = () => {
  const { selectedDeviceId, setSelectedDeviceId } = usePOSContext();
  const [devices, setDevices] = useState<
    FunctionReturnType<typeof api.square.square.listDevices>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSelected = useRef(false);

  const listDevices = useAction(api.square.square.listDevices);

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const deviceList = await listDevices();
      setDevices(deviceList);
      // Auto-select first device if none selected and devices exist
      if (!hasAutoSelected.current && deviceList.length > 0) {
        hasAutoSelected.current = true;
        setSelectedDeviceId(deviceList[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch devices:", err);
      setError(err instanceof Error ? err.message : "Failed to load devices");
    } finally {
      setIsLoading(false);
    }
  }, [listDevices, setSelectedDeviceId]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading devices...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  if (devices.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No terminals connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Monitor className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedDeviceId || undefined}
        onValueChange={(value) => setSelectedDeviceId(value)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select terminal" />
        </SelectTrigger>
        <SelectContent>
          {devices.map((device) => (
            <SelectItem key={device.id} value={device.id}>
              <div className="flex items-center gap-2">
                <span>{device.name}</span>
                {device.status !== "ACTIVE" && (
                  <span className="text-xs text-muted-foreground">
                    ({device.status.toLowerCase()})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
