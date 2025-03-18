
import { Sparkles } from "lucide-react";

export const ProfileHeader = () => {
  return (
    <div className="mb-6 mt-10">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          LadyLedger
          <Sparkles className="h-6 w-6 text-amber-500" />
        </h1>
        <h2 className="text-muted-foreground text-sm italic mb-2">Your Finance Companion</h2>
        <h3 className="text-xl font-semibold mb-6">Complete Your Profile</h3>
      </div>
    </div>
  );
};
