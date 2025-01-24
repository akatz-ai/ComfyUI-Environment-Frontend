import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Trash,
  Image,
  Copy,
  Package,
  Hash,
  Folder,
  Terminal,
  Tag,
  Network,
  HardDrive,
} from "lucide-react";
import { Environment, MountConfig } from "@/types/Environment";

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center space-x-2">
      {icon}
      <span className="text-sm">
        <span className="font-medium">{label}:</span> {value}
      </span>
    </div>
  );
}

function isNewMountConfigStyle(mountConfig: any): boolean {
  return Array.isArray(mountConfig?.mounts);
}

interface EnvironmentInfoCardProps {
  environment: Environment;
}

export const EnvironmentInfoCard: React.FC<EnvironmentInfoCardProps> = ({
  environment,
}) => {
  const mountConfig = environment.options?.["mount_config"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          <InfoItem
            icon={<Calendar className="h-4 w-4" />}
            label="Created At"
            value={new Date(
              Number(environment.metadata?.["created_at"]) * 1000
            ).toLocaleString()}
          />
          {environment.folderIds &&
            environment.folderIds.length > 0 &&
            environment.folderIds[0] === "deleted" && (
              <InfoItem
                icon={<Trash className="h-4 w-4" />}
                label="Deleted At"
                value={new Date(
                  Number(environment.metadata?.["deleted_at"]) * 1000
                ).toLocaleString()}
              />
            )}
          <InfoItem
            icon={<Image className="h-4 w-4" />}
            label="Base Image"
            value={environment.metadata?.["base_image"] as string}
          />
          <InfoItem
            icon={<Copy className="h-4 w-4" />}
            label="Duplicate"
            value={environment.duplicate ? "Yes" : "No"}
          />
          <InfoItem
            icon={<Package className="h-4 w-4" />}
            label="Container Name"
            value={environment.container_name || environment.name || "N/A"}
          />
          <InfoItem
            icon={<Hash className="h-4 w-4" />}
            label="Container ID"
            value={environment.id || "N/A"}
          />
          <InfoItem
            icon={<Folder className="h-4 w-4" />}
            label="ComfyUI Path"
            value={environment.comfyui_path || "N/A"}
          />
          <InfoItem
            icon={<Terminal className="h-4 w-4" />}
            label="Command"
            value={environment.command || "N/A"}
          />
          <InfoItem
            icon={<Tag className="h-4 w-4" />}
            label="ComfyUI Release"
            value={environment.options?.["comfyui_release"] as string}
          />
          <InfoItem
            icon={<Network className="h-4 w-4" />}
            label="Port"
            value={environment.options?.["port"] as string}
          />
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <HardDrive className="h-4 w-4 mr-2" />
            Mount Config
          </h4>
          {isNewMountConfigStyle(mountConfig) ? (
            <ul className="grid grid-cols-1 gap-2">
              {mountConfig?.mounts.map((mount: any, index: number) => (
                <li key={index} className="text-sm">
                  <span className="font-medium">Container Path:</span>{" "}
                  {mount.container_path}
                  <br />
                  <span className="font-medium">Host Path:</span>{" "}
                  {mount.host_path}
                  <br />
                  <span className="font-medium">Type:</span> {mount.type}
                  <br />
                  {/* <span className="font-medium">Read Only:</span>{" "}
                  {mount.read_only ? "Yes" : "No"} */}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {Object.entries(mountConfig || {}).map(([key, value]) => (
                <li key={key} className="text-sm">
                  <span className="font-medium">{key}:</span>{" "}
                  {value as unknown as string}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
