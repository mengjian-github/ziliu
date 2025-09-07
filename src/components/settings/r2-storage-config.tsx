'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TestTube, Save, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useUserPlan } from '@/lib/subscription/hooks/useUserPlan';

interface R2Config {
  enabled: boolean;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
  hasAccessKey: boolean;
  hasSecretKey: boolean;
}

export default function R2StorageConfig() {
  const { isPro, checkFeatureAccess } = useUserPlan();
  const [config, setConfig] = useState<R2Config>({
    enabled: false,
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    publicUrl: '',
    hasAccessKey: false,
    hasSecretKey: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 检查专业版权限
  const customR2Access = checkFeatureAccess('custom-r2');
  const hasCustomR2Access = customR2Access.hasAccess;

  // 加载配置
  useEffect(() => {
    if (hasCustomR2Access) {
      loadConfig();
    }
  }, [hasCustomR2Access]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/r2-config');
      const result = await response.json();

      if (result.success) {
        setConfig(result.data);
      } else {
        setMessage({ type: 'error', text: result.error || '加载配置失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '加载配置失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
      setMessage({ type: 'error', text: '请填写完整的R2配置信息' });
      return;
    }

    try {
      setTesting(true);
      setMessage(null);

      const response = await fetch('/api/user/r2-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: config.accountId,
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
          bucketName: config.bucketName,
          publicUrl: config.publicUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'R2连接测试成功！' });
      } else {
        setMessage({ type: 'error', text: result.error || '连接测试失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '连接测试失败，请检查网络连接' });
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/user/r2-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: config.enabled,
          accountId: config.accountId,
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
          bucketName: config.bucketName,
          publicUrl: config.publicUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message || '配置保存成功' });
        // 重新加载配置以更新hasAccessKey和hasSecretKey状态
        await loadConfig();
      } else {
        setMessage({ type: 'error', text: result.error || '保存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  if (!hasCustomR2Access) {
    return (
      <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            自定义R2存储
          </CardTitle>
          <CardDescription className="text-gray-600">
            使用您自己的Cloudflare R2存储，突破500张/月的限制
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              自定义R2存储功能仅限专业版用户使用。
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                onClick={() => window.open('/pricing', '_blank')}
              >
                升级到专业版
              </Button>
              即可解锁此功能。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <CheckCircle className="h-6 w-6 text-green-500" />
          自定义R2存储
        </CardTitle>
        <CardDescription className="text-gray-600">
          配置您的Cloudflare R2存储，享受无限制的图片存储空间
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">加载配置中...</span>
          </div>
        ) : (
          <>
            {/* 启用开关 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-gray-900">启用自定义R2存储</Label>
                <div className="text-xs text-gray-600">
                  启用后将使用您的R2存储，不计入平台配额
                </div>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
              />
            </div>

            {config.enabled && (
              <>
                {/* 配置表单 */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="accountId" className="text-sm font-medium text-gray-700">Account ID *</Label>
                    <Input
                      id="accountId"
                      value={config.accountId}
                      onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
                      placeholder="您的Cloudflare账户ID"
                      className="text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="accessKeyId" className="text-sm font-medium text-gray-700">Access Key ID *</Label>
                    <Input
                      id="accessKeyId"
                      value={config.accessKeyId}
                      onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                      placeholder={config.hasAccessKey ? '••••••••••••••••' : 'R2访问密钥ID'}
                      className="text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="secretAccessKey" className="text-sm font-medium text-gray-700">Secret Access Key *</Label>
                    <Input
                      id="secretAccessKey"
                      type="password"
                      value={config.secretAccessKey}
                      onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                      placeholder={config.hasSecretKey ? '••••••••••••••••' : 'R2访问密钥'}
                      className="text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bucketName" className="text-sm font-medium text-gray-700">Bucket Name *</Label>
                    <Input
                      id="bucketName"
                      value={config.bucketName}
                      onChange={(e) => setConfig({ ...config, bucketName: e.target.value })}
                      placeholder="您的R2存储桶名称"
                      className="text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="publicUrl" className="text-sm font-medium text-gray-700">公开访问URL（可选）</Label>
                    <Input
                      id="publicUrl"
                      value={config.publicUrl}
                      onChange={(e) => setConfig({ ...config, publicUrl: e.target.value })}
                      placeholder="https://your-domain.com"
                      className="text-sm"
                    />
                    <div className="text-xs text-gray-600">
                      如果您配置了自定义域名，请填写此项
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={testConnection}
                    disabled={testing || !config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName}
                  >
                    {testing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        测试中...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        测试连接
                      </>
                    )}
                  </Button>

                  <Button onClick={saveConfig} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存配置
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {!config.enabled && (
              <div className="flex gap-2">
                <Button onClick={saveConfig} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存配置
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 消息提示 */}
            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : message.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            {/* 帮助信息 */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">配置说明：</div>
                  <ol className="text-sm space-y-1 list-decimal list-inside ml-2">
                    <li>在Cloudflare控制台创建R2存储桶</li>
                    <li>生成R2访问令牌（API Token）</li>
                    <li>配置存储桶的公开访问权限</li>
                    <li>填写上述配置信息并测试连接</li>
                  </ol>
                  <div className="text-xs text-muted-foreground mt-2">
                    启用自定义R2后，您的图片将直接上传到您的存储桶，不计入平台500张/月的限制。
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}