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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
                {error}
              </div>
            )}
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
        </CardContent>
      </Card>
    </div>
  );
}
