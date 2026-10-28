import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Terminal, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const loginSchema = z.object({
    login: z.string().min(1, t('auth.errors.loginRequired')),
    password: z.string().min(1, t('auth.errors.passwordRequired')),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.login, data.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.response?.data?.errors?.login) {
        setServerError(err.response.data.errors.login[0]);
      } else if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else {
        setServerError(t('auth.unexpectedError'));
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-violet-600 dark:text-violet-400 mx-auto shadow-2xs">
            <Terminal className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('auth.welcomeBack')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('auth.signInSubtitle')}</p>
        </div>

      
        {serverError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Card */}
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.usernameOrEmail')}
              placeholder={t('auth.usernameOrEmailPlaceholder')}
              autoComplete="username"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.login?.message}
              {...register('login')}
            />

            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('common.signIn')}
            </Button>
          </form>
        </Card>

        <p className="text-xs text-center text-zinc-500">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/register" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
            {t('auth.createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
};
