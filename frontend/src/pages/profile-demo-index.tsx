import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import Link from "next/link";

export default function ProfileDemoIndexPage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    }
  }, [authChecked, loggedIn, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader className="animate-spin text-purple-400" size={32} />
      </div>
    );
  }

  if (!loggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent mb-2">
            Profile Demos
          </h1>
          <p className="text-purple-300">
            All demo variants have been integrated into the main profile page
          </p>
        </div>

        <div className="text-center">
          <Card className="bg-gradient-to-br from-purple-900/90 via-fuchsia-800/80 to-pink-900/90 border border-pink-400/50 shadow-2xl shadow-purple-900/30 backdrop-blur-sm">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent mb-4">
                ✨ Enhanced Profile Page ✨
              </h3>
              <p className="text-purple-200 text-lg leading-relaxed mb-6">
                The main profile page now includes all the best features from the demos:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
                <div className="text-purple-200">
                  <h4 className="font-semibold text-pink-300 mb-2">🎯 New Features:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Badges & Achievements tab</li>
                    <li>• 5 different team table styles</li>
                    <li>• Production-ready data handling</li>
                    <li>• Enhanced UI/UX design</li>
                  </ul>
                </div>
                <div className="text-purple-200">
                  <h4 className="font-semibold text-pink-300 mb-2">🛠️ Team Table Styles:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Classic Table</li>
                    <li>• Modern Grid</li>
                    <li>• Compact List</li>
                    <li>• Member Cards</li>
                    <li>• Minimal View</li>
                  </ul>
                </div>
              </div>
              <Link href="/profile" passHref>
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none hover:from-pink-600 hover:to-purple-600 hover:scale-105 transition-all duration-200">
                  🚀 Go to Enhanced Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 