import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useLanguage } from "@/context/LanguageContext"

interface RegisterContentProps {
    form: {
        username: string;
        email: string;
        password: string;
    };
    loading: boolean;
    message: { type: "success" | "error"; text: string } | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
}

const RegisterContent: React.FC<RegisterContentProps> = ({
    form,
    loading,
    message,
    onChange,
    onSubmit,
}) => {
    const { t } = useLanguage();

    return (
        <div className="bg-muted flex min-h-screen flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm">
                {message && (
                    <Alert
                        variant={message.type === "error" ? "destructive" : "default"}
                        className="mb-6"
                    >
                        {message.type === "error" ? (
                            <AlertTriangle className="h-4 w-4" />
                        ) : (
                            <CheckCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>{message.type === "error" ? t('error') : t('success')}</AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">{t('sign_up')}</CardTitle>
                        <CardDescription>{t('create_account')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="identifier">{t('username')}</Label>
                                <Input
                                    type="text"
                                    name="username"
                                    placeholder={t('username')}
                                    value={form.username}
                                    onChange={onChange}
                                    required
                                />

                                <Label htmlFor="email">{t('email')}</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder={t('email')}
                                    value={form.email}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">{t('password')}</Label>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder={t('password_min_8')}
                                    minLength={8}
                                    value={form.password}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? t('loading') : t('register')}
                            </Button>
                            <p className="text-center text-sm text-muted-foreground">
                                {t('already_have_account')}{" "}
                                <Link href="/login" className="underline underline-offset-4">
                                    {t('sign_in')}
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RegisterContent;
