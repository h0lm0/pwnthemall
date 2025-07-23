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
import React from "react"

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
    const [errors, setErrors] = React.useState<{username?: string, email?: string, password?: string}>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let error = "";
        if (name === "username" && value.length > 32) error = t('username_too_long') || "Username too long (max 32)";
        if (name === "email" && value.length > 254) error = t('email_too_long') || "Email too long (max 254)";
        if (name === "password" && value.length > 72) error = t('password_too_long') || "Password too long (max 72)";
        setErrors({ ...errors, [name]: error });
        onChange(e);
    };

    return (
        <div className="bg-muted flex min-h-screen flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">{t('sign_up')}</CardTitle>
                        <CardDescription>{t('create_account')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {message && (
                            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                                {message.type === 'error' ? (
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                ) : (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                                <AlertTitle>{message.type === 'error' ? t('error') : t('success')}</AlertTitle>
                                <AlertDescription>{t(message.text) || message.text}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={onSubmit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="identifier">{t('username')}</Label>
                                <Input
                                    type="text"
                                    name="username"
                                    placeholder={t('username')}
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                    maxLength={32}
                                />
                                {errors.username && <span className="text-red-500 text-xs">{errors.username}</span>}

                                <Label htmlFor="email">{t('email')}</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder={t('email')}
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    maxLength={254}
                                />
                                {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
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
                                    onChange={handleChange}
                                    required
                                    maxLength={72}
                                />
                                {errors.password && <span className="text-red-500 text-xs">{errors.password}</span>}
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
