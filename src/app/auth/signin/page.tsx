'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
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
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('邮箱或密码错误');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('登录失败，请重试');
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
          <h1 className="text-3xl font-semibold text-foreground">登录字流</h1>
          <p className="text-sm text-muted-foreground">让文字如流水般顺畅发布</p>
        </div>

        <Card className="border border-primary/10 bg-white/80 backdrop-blur-xl shadow-[0_24px_80px_-40px_rgba(0,26,77,0.6)]">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-foreground">欢迎回来</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              输入邮箱和密码即可开始创作
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground/80">
                  邮箱
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
                  placeholder="请输入密码"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              还没有账户？{' '}
              <Link href="/auth/signup" className="font-semibold text-primary">
                立即注册
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
