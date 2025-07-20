// CookieConsent.tsx
// shadcn/ui style cookie consent component with Accept/Decline, Learn more, and callbacks
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideCookie } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface CookieConsentProps {
  variant?: "default" | "compact";
  onAcceptCallback?: () => void;
  onDeclineCallback?: () => void;
  className?: string;
}

const COOKIE_NAME = "cookie_consent";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function getCookie(name: string) {
  return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  variant = "default",
  onAcceptCallback,
  onDeclineCallback,
  className,
}) => {
  const [visible, setVisible] = React.useState(false);
  const { t } = useLanguage();

  React.useEffect(() => {
    if (typeof document !== "undefined" && !getCookie(COOKIE_NAME)) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setCookie(COOKIE_NAME, "accepted", 365);
    setVisible(false);
    onAcceptCallback?.();
  };

  const handleDecline = () => {
    setCookie(COOKIE_NAME, "declined", 365);
    setVisible(false);
    onDeclineCallback?.();
    window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  };

  if (!visible) return null;

  return (
    <div className={cn(
      "fixed inset-x-0 bottom-0 z-50 flex items-center justify-center p-4",
      className
    )}>
      <Card className="w-full max-w-md border shadow-lg bg-background">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <LucideCookie className="w-5 h-5" />
            {t('cookie_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t('cookie_message')}
            <br />
            <span className="block mt-2 text-xs">
              {t('cookie_accept_message')}
            </span>
            <Link href="/learn-more" className="underline text-xs mt-1 inline-block">
              {t('learn_more')}
            </Link>
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleAccept} variant={"default" as any}>
              {t('accept')}
            </Button>
            <Button className="flex-1" onClick={handleDecline} variant={"secondary" as any}>
              {t('decline')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 