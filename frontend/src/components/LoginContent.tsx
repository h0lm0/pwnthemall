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

interface LoginContentProps {
    form: {
        identifier: string
        password: string
    }
    message: string | null
    messageType: "success" | "error" | null
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onSubmit: (e: React.FormEvent) => void
}

export default function LoginContent({
    form,
    message,
    messageType,
    onChange,
    onSubmit,
}: LoginContentProps) {
    const { t } = useLanguage();

    return (
        <div className="bg-muted flex min-h-screen flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm">
                {message && (
                    <Alert
                        variant={messageType === "error" ? "destructive" : "default"}
                        className="mb-6"
                    >
                        {messageType === "error" ? (
                            <AlertTriangle className="h-4 w-4" />
                        ) : (
                            <CheckCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>{messageType === "error" ? t('error') : t('success')}</AlertTitle>
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">{t('welcome_back')}</CardTitle>
                        <CardDescription>{t('enter_credentials')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="identifier">{t('username_or_email')}</Label>
                                <Input
                                    id="identifier"
                                    name="identifier"
                                    value={form.identifier}
                                    onChange={onChange}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password" >{t('password')}</Label>
                                    <a
                                        href="#"
                                        tabIndex={-1}
                                        className="ml-auto text-sm underline-offset-4 hover:underline"
                                    >
                                        {t('forgot_password')}
                                    </a>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="***********"
                                    value={form.password}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                {t('login')}
                            </Button>
                            <p className="text-center text-sm text-muted-foreground">
                                {t('dont_have_account')}{" "}
                                <Link href="/register" className="underline underline-offset-4">
                                    {t('sign_up')}
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
