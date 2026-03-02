import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Monitor } from "lucide-react";
import { usePOSContext } from "@/contexts";

export const DeviceSelector = () => {
  const { selectedDeviceId, setSelectedDeviceId, devices, devicesLoading, devicesError } =
    usePOSContext();

  if (devicesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading devices...</span>
      </div>
    );
  }

  if (devicesError) {
    return <div className="text-sm text-destructive">{devicesError}</div>;
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
