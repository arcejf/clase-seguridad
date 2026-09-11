import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate, type Location } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { ApiError } from '@/lib/api-error';
import { loginSchema, type LoginInput } from '@/schemas/auth.schemas';

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function goToOrigin() {
    // Si llegamos acá porque una ruta protegida nos mandó a /login,
    // location.state.from tiene la ruta original (ver auth/ProtectedRoute.tsx).
    const from = (location.state as { from?: Location })?.from;
    navigate(from ? `${from.pathname}${from.search ?? ''}` : '/', { replace: true });
  }

  async function onSubmit(input: LoginInput) {
    try {
      await login(input);
      goToOrigin();
    } catch (err) {
      // El backend responde siempre el mismo mensaje genérico (anti user-enumeration),
      // así que el frontend tampoco intenta adivinar si falló el email o la contraseña.
      toast.error(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    }
  }

  async function handleGoogleCredential(credential: string) {
    try {
      await loginWithGoogle(credential);
      goToOrigin();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión con Google');
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <GoogleSignInButton onCredential={handleGoogleCredential} />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                Entrar
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="underline">
              Registrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
