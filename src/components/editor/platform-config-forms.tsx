// 平台特定的配置表单组件（基础架构，暂时只显示平台信息）

import { Platform, PLATFORM_CONFIGS } from '@/types/platform-settings';

interface PlatformConfigFormProps {
  platform: Platform;
  config: any;
  onChange: (config: any) => void;
}

export function PlatformConfigForm({ platform, config, onChange }: PlatformConfigFormProps) {
  const platformInfo = PLATFORM_CONFIGS[platform];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{platformInfo.icon}</span>
        <div>
          <h4 className="font-medium text-gray-900">{platformInfo.name}设置</h4>
          <p className="text-sm text-gray-500">{platformInfo.description}</p>
        </div>
      </div>



      {/* 未来在这里添加平台特定的字段 */}
    </div>
  );
}



