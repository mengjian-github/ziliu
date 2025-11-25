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
    <div className="relative min-h-screen px-4 py-12 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,255,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(0,212,255,0.12),transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.24),transparent_38%),linear-gradient(240deg,rgba(255,255,255,0.24),transparent_32%)]" />

      <div className="relative z-10 w-full max-w-xl space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-[#2a80ff] to-secondary text-white shadow-[0_18px_40px_-18px_rgba(0,102,255,0.75)]">
            <span className="text-lg font-semibold">Z</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground">注册字流</h1>
          <p className="text-sm text-muted-foreground">一次创作，流向每个平台</p>
        </div>

        <Card className="border border-primary/10 bg-white/80 backdrop-blur-xl shadow-[0_24px_80px_-40px_rgba(0,26,77,0.6)]">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-foreground">创建账户</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
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
                <label htmlFor="name" className="block text-sm font-semibold text-foreground/80">
                  姓名
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground/80">
                  邮箱
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-foreground/80">
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
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? '注册中...' : '注册'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              已有账户？{' '}
              <Link href="/auth/signin" className="font-semibold text-primary">
                立即登录
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
