import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  EnvironmentInput, 
  EnvironmentFormValues,
  baseFormSchema,
  EnvironmentTypeEnum,
  MountConfigFormValues
} from "@/types/Environment";
import { UserSettings } from "@/types/UserSettings";
import { useComfyUIInstall } from "@/hooks/use-comfyui-install";
import { 
  checkImageExists, 
  checkValidComfyUIPath 
} from "@/api/environmentApi";
import { 
  getLatestComfyUIReleaseFromBranch, 
  COMFYUI_IMAGE_NAME 
} from "@/components/utils/ComfyUtils";
import { getDefaultMountConfigsForEnvType } from "@/components/utils/MountConfigUtils";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_COMFYUI_PATH = import.meta.env.VITE_DEFAULT_COMFYUI_PATH;
const SUCCESS_TOAST_DURATION = 2000;

export const useFormDefaults = (userSettings: UserSettings) => {
  return useMemo(() => ({
    name: "",
    release: "latest",
    image: "",
    comfyUIPath: userSettings?.comfyui_path || DEFAULT_COMFYUI_PATH || "",
    environmentType: EnvironmentTypeEnum.Default,
    command: userSettings?.command || "",
    port: String(userSettings?.port) || "8188",
    runtime: userSettings?.runtime || "nvidia",
    mountConfig: getDefaultMountConfigsForEnvType(
      EnvironmentTypeEnum.Default,
      userSettings?.comfyui_path || DEFAULT_COMFYUI_PATH || ""
    ) as MountConfigFormValues[]
  }), [userSettings]);
};


export const useEnvironmentCreation = (
  defaultValues: EnvironmentFormValues,
  releaseOptions: string[],
  createHandler: (env: EnvironmentInput) => Promise<void>,
  toast: ReturnType<typeof useToast>['toast']
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEnvironment, setPendingEnvironment] = useState<EnvironmentInput | null>(null);
  const [pullImageDialog, setPullImageDialog] = useState(false);

  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(baseFormSchema),
    defaultValues,
    mode: "onChange"
  });

  const { 
    installComfyUIDialog, 
    setInstallComfyUIDialog,
    isInstalling,
    handleInstallComfyUI
  } = useComfyUIInstall(form, releaseOptions, toast);

  const createEnvironment = useCallback(async (env: EnvironmentInput | null) => {
    if (!env) return;
    
    try {
      await createHandler(env);
      setIsOpen(false);
      form.reset(defaultValues);
      toast({
        title: "Success",
        description: "Environment created successfully",
        duration: SUCCESS_TOAST_DURATION,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setPendingEnvironment(null);
    }
  }, [createHandler, form, defaultValues, toast]);

  const handleSubmit = useCallback(async (values: EnvironmentFormValues) => {
    try {
      setIsLoading(true);
      const release = getLatestComfyUIReleaseFromBranch(values.release || "latest", releaseOptions);
      
      const newEnvironment: EnvironmentInput = {
        name: values.name,
        image: values.image || `${COMFYUI_IMAGE_NAME}:${release}`,
        command: values.command,
        comfyui_path: values.comfyUIPath,
        options: {
          comfyui_release: release,
          port: values.port,
          mount_config: { mounts: values.mountConfig },
          runtime: values.runtime,
        }
      };

      setPendingEnvironment(newEnvironment);
      
      const [imageExists, pathValid] = await Promise.all([
        checkImageExists(newEnvironment.image),
        checkValidComfyUIPath(newEnvironment.comfyui_path || "")
      ]);

      if (!imageExists) return setPullImageDialog(true);
      if (!pathValid) return setInstallComfyUIDialog(true);

      await createEnvironment(newEnvironment);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Submission failed",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [releaseOptions, createEnvironment, setInstallComfyUIDialog, toast]);

  return {
    form,
    isOpen,
    isLoading,
    pendingEnvironment,
    pullImageDialog,
    installComfyUIDialog,
    isInstalling,
    setInstallComfyUIDialog,
    setIsOpen,
    setPullImageDialog,
    handleSubmit,
    handleInstallComfyUI,
    handleInstallFinished: createEnvironment
  };
};