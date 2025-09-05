'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Chrome, 
  Settings, 
  FolderOpen,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function ExtensionPage() {
  const [extensionStatus, setExtensionStatus] = useState<'checking' | 'installed' | 'not-installed'>('checking');
  const [isDownloading, setIsDownloading] = useState(false);
  const [latest, setLatest] = useState<{ version?: string; url?: string } | null>(null);

  // 加载最新插件包信息
  useEffect(() => {
    fetch('/extension-latest.json')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setLatest(data))
      .catch(() => setLatest(null));
  }, []);

  // 检测插件是否已安装
  useEffect(() => {
    const checkExtension = () => {
      console.log('🔍 检测插件是否已安装...');
      
      // 发送检测消息到插件
      window.postMessage({ 
        type: 'ZILIU_EXTENSION_DETECT',
        source: 'ziliu-website' 
      }, '*');

      // 设置超时，如果2秒内没有响应则认为未安装
      const timeout = setTimeout(() => {
        console.log('⏰ 插件检测超时，可能未安装');
        setExtensionStatus('not-installed');
      }, 2000);

      // 监听插件响应
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'ZILIU_EXTENSION_RESPONSE') {
          console.log('✅ 检测到插件已安装:', event.data);
          clearTimeout(timeout);
          setExtensionStatus('installed');
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
      
      return () => {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
      };
    };

    // 延迟一点时间再检测，确保页面完全加载
    const delayedCheck = setTimeout(checkExtension, 500);
    
    return () => clearTimeout(delayedCheck);
  }, []);

  // 重新检测插件
  const recheckExtension = () => {
    setExtensionStatus('checking');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // 下载插件文件
  const downloadExtension = async () => {
    setIsDownloading(true);
    try {
      // 创建下载链接
      const link = document.createElement('a');
      const href = latest?.url || '/ziliu-extension-v1.2.0.zip';
      link.href = href; // 默认回退
      link.download = href.split('/').pop() || 'ziliu-extension.zip';
      link.click();
    } catch (error) {
      console.error('下载失败:', error);
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Chrome className="text-blue-600" size={48} />
          <h1 className="text-4xl font-bold">字流助手浏览器插件</h1>
        </div>
        <p className="text-gray-600 text-lg">
          一键智能填充，让多平台内容发布更高效！
        </p>
      </div>

      {/* 插件状态检测 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-lg font-medium">插件状态检测</div>
              {extensionStatus === 'checking' && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={14} />
                  检测中...
                </Badge>
              )}
              {extensionStatus === 'installed' && (
                <Badge className="bg-green-600 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  已安装
                </Badge>
              )}
              {extensionStatus === 'not-installed' && (
                <Badge variant="destructive" className="flex items-center gap-2">
                  <AlertCircle size={14} />
                  未安装
                </Badge>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={recheckExtension}
              disabled={extensionStatus === 'checking'}
            >
              <RefreshCw size={16} className="mr-2" />
              重新检测
            </Button>
          </div>

          {extensionStatus === 'installed' && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 size={18} />
                <span className="font-medium">插件已成功安装！</span>
              </div>
              <p className="text-green-700 mt-2">
                你现在可以在编辑器中使用一键发布功能了。
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-green-700 underline ml-2"
                  onClick={() => window.open('/editor/new', '_blank')}
                >
                  立即体验 <ExternalLink size={14} className="ml-1" />
                </Button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {extensionStatus !== 'installed' && (
        <>
          {/* 插件下载 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="text-blue-600" />
                下载插件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={downloadExtension}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      下载中...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2" />
                      下载插件文件 {latest?.version ? `(v${latest.version})` : ''}
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  文件大小约 50KB，支持 Chrome、Edge 等浏览器
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 安装指南 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="text-green-600" />
                安装指南
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">下载并解压插件文件</h3>
                    <p className="text-gray-600">点击上方按钮下载最新 zip 文件{latest?.version ? `（v${latest.version}）` : ''}，然后解压到任意文件夹</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      打开浏览器扩展管理页面
                      <Chrome size={16} />
                    </h3>
                    <p className="text-gray-600">在地址栏输入 
                      <code className="mx-1 px-2 py-1 bg-gray-100 rounded text-sm">chrome://extensions/</code>
                      并回车
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">启用开发者模式</h3>
                    <p className="text-gray-600">在页面右上角找到"开发者模式"开关并开启</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      加载解压的扩展程序
                      <FolderOpen size={16} />
                    </h3>
                    <p className="text-gray-600">点击"加载已解压的扩展程序"按钮，选择解压后的插件文件夹</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-medium text-green-700">安装完成</h3>
                    <p className="text-gray-600">安装成功后，刷新本页面即可看到"已安装"状态，然后就可以使用一键发布功能了</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 功能介绍 */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 功能特色</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">📱 多平台支持</h3>
              <p className="text-gray-600 text-sm">支持微信公众号、知乎、掘金、知识星球、视频号、抖音、B站、小红书等主流内容平台</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">🎯 智能检测</h3>
              <p className="text-gray-600 text-sm">自动检测剪贴板内容，智能识别需要发布的平台页面</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">⚡ 一键填充</h3>
              <p className="text-gray-600 text-sm">在字流网站编辑完成后，一键发布到目标平台，无需手动复制粘贴</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">🔄 格式适配</h3>
              <p className="text-gray-600 text-sm">根据不同平台自动调整内容格式，确保最佳显示效果</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
