import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, PlayCircle, StopCircle } from "lucide-react";
import { useCTFStatus } from "@/hooks/use-ctf-status";
import { useLanguage } from "@/context/LanguageContext";

export default function CTFStatusOverview() {
  const { ctfStatus, loading } = useCTFStatus();
  const { t } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "ended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "no_timing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return <Clock className="h-4 w-4" />;
      case "active":
        return <PlayCircle className="h-4 w-4" />;
      case "ended":
        return <StopCircle className="h-4 w-4" />;
      case "no_timing":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "not_started":
        return t("ctf_status_not_started") || "Not Started";
      case "active":
        return t("ctf_status_active") || "Active";
      case "ended":
        return t("ctf_status_ended") || "Ended";
      case "no_timing":
        return t("ctf_status_no_timing") || "No Timing Configured";
      default:
        return t("ctf_status_unknown") || "Unknown";
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "not_started":
        return t("ctf_status_not_started_desc") || "The CTF competition has not started yet. Participants cannot access challenges or submit flags.";
      case "active":
        return t("ctf_status_active_desc") || "The CTF competition is currently active. Participants can access challenges and submit flags.";
      case "ended":
        return t("ctf_status_ended_desc") || "The CTF competition has ended. Challenges are visible but flag submission is disabled.";
      case "no_timing":
        return t("ctf_status_no_timing_desc") || "No start or end times are configured. The CTF operates without time restrictions.";
      default:
        return t("ctf_status_unknown_desc") || "Unable to determine CTF status.";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("ctf_status") || "CTF Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <span className="text-muted-foreground">{t("loading_ctf_status") || "Loading CTF status..."}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ctfStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("ctf_status") || "CTF Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            {t("unable_to_load_ctf_status") || "Unable to load CTF status."}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("ctf_status") || "CTF Status"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={`flex items-center gap-1 ${getStatusColor(ctfStatus.status)}`}>
            {getStatusIcon(ctfStatus.status)}
            {getStatusText(ctfStatus.status)}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {getStatusDescription(ctfStatus.status)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{t("competition_active") || "Competition Active"}:</span>
            <Badge variant={ctfStatus.is_active ? "default" : "secondary"}>
              {ctfStatus.is_active ? (t("yes") || "Yes") : (t("no") || "No")}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{t("competition_started") || "Competition Started"}:</span>
            <Badge variant={ctfStatus.is_started ? "default" : "secondary"}>
              {ctfStatus.is_started ? (t("yes") || "Yes") : (t("no") || "No")}
            </Badge>
          </div>
        </div>

        {ctfStatus.status !== "no_timing" && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>
              💡 <strong>{t("tip") || "Tip"}:</strong> {t("ctf_timing_tip") || "Edit the CTF_START_TIME and CTF_END_TIME configurations below to control when the competition runs."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
