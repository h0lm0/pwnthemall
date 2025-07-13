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
                        <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Sign up</CardTitle>
                        <CardDescription>Create a new account to continue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="identifier">Username</Label>
                                <Input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    value={form.username}
                                    onChange={onChange}
                                    required
                                />

                                <Label htmlFor="email">Email</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Password (min. 8 chars)"
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
                                {loading ? "Loading..." : "Register"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RegisterContent;
