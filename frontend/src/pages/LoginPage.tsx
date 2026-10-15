import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Terminal, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const loginSchema = z.object({
  login: z.string().min(1, 'Please enter your email or username'),
  password: z.string().min(1, 'Please enter your password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

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
        setServerError('An unexpected error occurred. Please check your credentials.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-violet-400 mx-auto">
            <Terminal className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Welcome Back</h1>
          <p className="text-xs text-zinc-400">Sign in to your CodeArena account</p>
        </div>

        {/* Demo credentials hint */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-400 space-y-1 text-left">
          <div className="font-medium text-zinc-300">Quick Test Credentials:</div>
          <div className="font-mono text-[11px] text-zinc-400">
            Username: <span className="text-violet-300">alexchen</span> · Pass:{' '}
            <span className="text-violet-300">Password123!</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-400">
            Admin: <span className="text-violet-300">admin</span> · Pass:{' '}
            <span className="text-violet-300">Password123!</span>
          </div>
        </div>

        {serverError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-xs text-rose-300 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Card */}
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username or Email"
              placeholder="e.g. alexchen or alex@example.com"
              autoComplete="username"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.login?.message}
              {...register('login')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
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
              Sign In
            </Button>
          </form>
        </Card>

        <p className="text-xs text-center text-zinc-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
