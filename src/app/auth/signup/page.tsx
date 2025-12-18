'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/auth/signin?message=注册成功，请登录');
      } else {
        setError(data.error || '注册失败');
      }
    } catch (error) {
      setError('注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 py-12 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden">
      {/* Dark Theme Background */}
      <div className="absolute inset-0 bg-[#020617]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,136,255,0.1),transparent_60%)] pointer-events-none blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.05),transparent_60%)] pointer-events-none blur-3xl opacity-30" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex mx-auto h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-[#2a80ff] to-secondary text-white shadow-[0_0_30px_-10px_rgba(0,136,255,0.6)] hover:scale-105 transition-transform">
            <span className="text-lg font-bold">Z</span>
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">注册字流</h1>
          <p className="text-sm text-zinc-400">一次创作，流向每个平台</p>
        </div>

        <Card className="border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
          <CardHeader className="text-center pb-6 border-b border-white/5">
            <CardTitle className="text-xl font-bold text-white">创建账户</CardTitle>
            <CardDescription className="text-sm text-zinc-400">
              填写信息来创建您的字流账户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                  姓名
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                  required
                  className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                  邮箱
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  required
                  className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
                  required
                  minLength={6}
                  className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary/50"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl h-11 text-base shadow-[0_0_20px_-5px_rgba(0,136,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(0,136,255,0.6)] transition-all"
                disabled={isLoading}
              >
                {isLoading ? '注册中...' : '注册'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
              已有账户？{' '}
              <Link href="/auth/signin" className="font-medium text-primary hover:text-primary/80 transition-colors">
                立即登录
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
