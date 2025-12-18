'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.1),transparent_70%)] pointer-events-none" />

            <div className="relative z-10 text-center max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                    <FileQuestion className="h-10 w-10 text-zinc-400" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-2">404</h1>
                <h2 className="text-xl font-semibold text-zinc-300 mb-4">页面未找到</h2>

                <p className="text-zinc-400 mb-8 leading-relaxed">
                    抱歉，您访问的页面不存在或已被移除。
                    <br />
                    请检查网址是否正确，或返回首页。
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/dashboard">
                        <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                            <Home className="h-4 w-4 mr-2" />
                            返回工作台
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="w-full sm:w-auto bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white">
                            前往官网
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
