import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setAuthToken, setUser } from "@/lib/auth";
import { AuthResponse } from "@/types/api";
import { X } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginData = z.infer<typeof loginSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { toast } = useToast();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return (await response.json()) as AuthResponse;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      setUser(data.user);
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.user.fullName}!`,
      });
      onClose();

      // Redirect based on user role
      if (data.user.role === "admin") {
        window.location.href = "/admin";
      } else if (data.user.role === "merchant") {
        window.location.href = "/merchant";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Demo login functions
  const loginAsAdmin = () => {
    form.setValue("email", "admin@wikistore.com");
    form.setValue("password", "admin123");
    loginMutation.mutate({
      email: "admin@wikistore.com",
      password: "admin123",
    });
  };

  const loginAsMerchant = () => {
    form.setValue("email", "joao@exemplo.com");
    form.setValue("password", "demo123");
    loginMutation.mutate({
      email: "joao@exemplo.com",
      password: "demo123",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Entrar
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      {...field}
                    />
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
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-muted-foreground">
                  Lembrar-me
                </label>
              </div>
              <Button variant="link" className="h-auto p-0 text-primary">
                Esqueci a senha
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>

            <div className="space-y-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm"
                onClick={loginAsMerchant}
                disabled={loginMutation.isPending}
              >
                Entrar como Lojista (Demo)
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm"
                onClick={loginAsAdmin}
                disabled={loginMutation.isPending}
              >
                Entrar como Admin (Demo)
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
