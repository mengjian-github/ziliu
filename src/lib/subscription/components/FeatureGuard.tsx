'use client';

import { ReactNode } from 'react';
import { useUserPlan } from '../hooks/useUserPlan';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGuardProps {
  feature: string;
  fallback?: ReactNode;
  upgradePrompt?: string; // 使用预定义的升级提示场景
  children: ReactNode;
  onAccessDenied?: (reason: string) => void;
}

export function FeatureGuard({ 
  feature, 
  fallback, 
  upgradePrompt,
  children,
  onAccessDenied
}: FeatureGuardProps) {
  const userPlanData = useUserPlan();
  const { checkFeatureAccess, isLoading } = userPlanData;


  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg h-20 flex items-center justify-center">
        <div className="text-gray-400 text-sm">检查权限中...</div>
      </div>
    );
  }

  const accessResult = checkFeatureAccess(feature);

  if (accessResult.hasAccess) {
    return <>{children}</>;
  }

  // 访问被拒绝，执行回调
  if (onAccessDenied) {
    onAccessDenied(accessResult.reason || '无权限访问');
  }

  // 使用指定的升级提示场景
  if (upgradePrompt) {
    return <UpgradePrompt scenario={upgradePrompt as any} />;
  }

  // 使用自动检测的升级提示场景
  if (accessResult.upgradePrompt) {
    return <UpgradePrompt scenario={accessResult.upgradePrompt as any} />;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
      <div className="text-gray-600 text-sm mb-2">{accessResult.reason}</div>
      <UpgradePrompt scenario="dashboard-upgrade" style="inline" />
    </div>
  );
}

// 便捷的特定功能守卫组件
export function PlatformGuard({ platform, children }: { 
  platform: 'zhihu' | 'juejin' | 'zsxq'; 
  children: ReactNode;
}) {
  return (
    <FeatureGuard 
      feature={`${platform}-platform`}
      upgradePrompt="platform-locked"
    >
      {children}
    </FeatureGuard>
  );
}

export function StyleGuard({ style, children }: { 
  style: 'default' | 'minimal' | 'elegant' | 'tech' | 'card' | 'print' | 'night'; 
  children: ReactNode;
}) {
  if (style === 'default') {
    return <>{children}</>;
  }
  
  return (
    <FeatureGuard 
      feature="advanced-styles"
      upgradePrompt="style-locked"
    >
      {children}
    </FeatureGuard>
  );
}

export function PresetGuard({ children }: { children: ReactNode }) {
  return (
    <FeatureGuard 
      feature="publish-presets"
      upgradePrompt="preset-locked"
    >
      {children}
    </FeatureGuard>
  );
}

// 文章创建守卫组件
export function ArticleCreationGuard({
  children,
  onCannotCreate
}: {
  children: ReactNode;
  onCannotCreate?: (reason: string) => void;
}) {
  return (
    <FeatureGuard 
      feature="unlimited-articles"
      onAccessDenied={onCannotCreate}
    >
      {children}
    </FeatureGuard>
  );
}
