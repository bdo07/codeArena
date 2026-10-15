import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Terminal, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const registerSchema = z
    .object({
      name: z.string().min(2, t('auth.errors.nameMin')),
      username: z
        .string()
        .min(3, t('auth.errors.usernameMin'))
        .max(30, t('auth.errors.usernameMax'))
        .regex(/^[a-zA-Z0-9_]+$/, t('auth.errors.usernameRegex')),
      email: z.string().email(t('auth.errors.emailInvalid')),
      password: z.string().min(8, t('auth.errors.passwordMin')),
      password_confirmation: z.string().min(1, t('auth.errors.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t('auth.errors.passwordsDontMatch'),
      path: ['password_confirmation'],
    });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerAuth(data);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        setServerError(err.response.data.errors[firstErrorKey][0]);
      } else if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else {
        setServerError(t('auth.registrationFailed'));
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
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('auth.createAccountTitle')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('auth.createAccountSubtitle')}</p>
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
              label={t('auth.fullName')}
              placeholder={t('auth.fullNamePlaceholder')}
              autoComplete="name"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label={t('auth.username')}
              placeholder={t('auth.usernamePlaceholder')}
              autoComplete="username"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              label={t('auth.emailAddress')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('auth.passwordMinPlaceholder')}
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label={t('auth.confirmPassword')}
              type="password"
              placeholder={t('auth.confirmPasswordPlaceholder')}
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password_confirmation?.message}
              {...register('password_confirmation')}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('common.signUp')}
            </Button>
          </form>
        </Card>

        <p className="text-xs text-center text-zinc-500">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
            {t('common.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
};
