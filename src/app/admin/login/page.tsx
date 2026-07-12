'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { t, toggleLanguage, language } = useLanguage();

  const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                       !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                       !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError(t('सुपाबेस कॉन्फिगरेशन गहाळ आहे. कृपया वर्सेल सेटिंग्ज तपासा.', 'Supabase configuration is missing. Please check your Vercel settings.'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/admin/dashboard');
        router.refresh(); // Refresh to trigger middleware re-evaluation
      }
    } catch (err) {
      setError(t('अनपेक्षित त्रुटी आली.', 'An unexpected error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-0 relative overflow-hidden">
        <CardHeader className="space-y-3 text-center bg-green-900 text-white rounded-t-xl flex flex-col items-center relative">
          <div className="absolute top-4 right-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-green-100 hover:bg-green-800 hover:text-white text-xs font-semibold px-2 py-1 h-7 border border-green-700/50 rounded-lg cursor-pointer"
            >
              🌐 {language === 'mr' ? 'EN' : 'मराठी'}
            </Button>
          </div>
          <div className="bg-white p-2 rounded-full shadow-sm mt-2">
            <Image 
              src="/logo.png" 
              alt="APMC Malkapur Admin" 
              width={64} 
              height={64} 
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">{t('APMC प्रशासन लॉगिन', 'APMC Admin Login')}</CardTitle>
          <CardDescription className="text-green-100">
            {t('डॅशबोर्डमध्ये प्रवेश करण्यासाठी आपले लॉगिन तपशील प्रविष्ट करा', 'Enter your credentials to access the dashboard')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {!isConfigured && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1">
                  ⚠️ Supabase Configuration Missing
                </p>
                <p>
                  It looks like your Supabase credentials are not configured on Vercel. Please add these to your Vercel Project Environment Variables:
                </p>
                <ul className="list-disc pl-5 font-mono space-y-0.5 text-[11px]">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
                <p className="mt-2 text-[10px] font-semibold text-amber-700">
                  Note: After adding environment variables in Vercel settings, you MUST trigger a new deployment (redeploy) for the changes to take effect.
                </p>
              </div>
            )}
            {error && (
              <div className="p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('ईमेल', 'Email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@malkapurapmc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('पासवर्ड', 'Password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('साइन इन होत आहे...', 'Signing in...') : t('साइन इन करा', 'Sign In')}
            </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
