'use client';

import { useState } from 'react';
import R2StorageConfig from '@/components/settings/r2-storage-config';
import ProfileSettings from '@/components/settings/profile-settings';
import { Settings, User, Cloud, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SettingTab = 'profile' | 'storage';

const tabs = [
  {
    id: 'profile' as SettingTab,
    label: '个人信息',
    icon: User,
    description: '管理您的基本资料和账户状态'
  },
  {
    id: 'storage' as SettingTab,
    label: '存储配置',
    icon: Cloud,
    description: '配置专属的图片存储，突破使用限制'
  }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>('profile');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-white/60">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回工作台
                </Button>
              </Link>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">设置</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-10">
          {/* Vertical Navigation */}
          <div className="w-72 shrink-0">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 px-2">设置选项</h2>
              <p className="text-sm text-gray-500 px-2 mt-1">选择要配置的功能</p>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full group relative flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all duration-300 overflow-hidden cursor-pointer",
                      isActive
                        ? "bg-gradient-to-r from-blue-50 via-blue-50/80 to-transparent border border-blue-100/60 shadow-sm"
                        : "hover:bg-white/40 hover:backdrop-blur-sm"
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full"></div>
                    )}
                    
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25"
                        : "bg-white/60 backdrop-blur-sm border border-white/60 group-hover:bg-white/80 group-hover:border-white/80"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-white" : "text-gray-600 group-hover:text-gray-700"
                      )} />
                    </div>
                    
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className={cn(
                        "font-semibold text-base transition-colors",
                        isActive ? "text-blue-900" : "text-gray-900 group-hover:text-gray-900"
                      )}>
                        {tab.label}
                      </div>
                      <div className={cn(
                        "text-sm mt-1 leading-relaxed transition-colors",
                        isActive ? "text-blue-700/80" : "text-gray-500 group-hover:text-gray-600"
                      )}>
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'storage' && <R2StorageConfig />}
          </div>
        </div>
      </main>
    </div>
  );
}