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
    <div className="min-h-screen bg-[#020617] text-zinc-200">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-white/10 text-zinc-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回工作台
                </Button>
              </Link>
              <div className="h-4 w-px bg-white/10"></div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">设置</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Vertical Navigation */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white px-2">设置选项</h2>
              <p className="text-sm text-zinc-500 px-2 mt-1">选择要配置的功能</p>
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
                      "w-full group relative flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all duration-300 overflow-hidden cursor-pointer border",
                      isActive
                        ? "bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(0,102,255,0.15)]"
                        : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full shadow-[0_0_10px_rgba(0,102,255,0.5)]"></div>
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                        : "bg-white/10 border border-white/5 group-hover:bg-white/20 group-hover:border-white/10"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                      )} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className={cn(
                        "font-semibold text-base transition-colors",
                        isActive ? "text-white" : "text-zinc-300 group-hover:text-white"
                      )}>
                        {tab.label}
                      </div>
                      <div className={cn(
                        "text-sm mt-1 leading-relaxed transition-colors",
                        isActive ? "text-blue-300" : "text-zinc-500 group-hover:text-zinc-400"
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
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'storage' && <R2StorageConfig />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}