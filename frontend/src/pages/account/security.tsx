import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldOff, Copy, Save } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SecuritySettings() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isDisabling, setIsDisabling] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const handleEnable2FA = async () => {
    setIsEnabling(true);
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/enable');
      if (!response.ok) throw new Error('Failed to enable 2FA.');
      const data = await response.json();
      
      setBackupCodes(data.backupCodes);
      setShowBackupCodesDialog(true);
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled.",
      });
      // In a real app, you would force a re-fetch of the user data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsDisabling(true);
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/disable', { password });
       if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to disable 2FA.');
      }
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
      setShowDisableDialog(false);
      // In a real app, you would force a re-fetch of the user data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDisabling(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast({ title: "Copied!", description: "Backup codes copied to clipboard." });
  };
  
  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "loadlink-africa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
          {user?.twoFactorEnabled ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-6 w-6 text-green-600" />
                <p className="font-medium text-green-800">2FA is currently enabled.</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setShowDisableDialog(true)}
                disabled={isDisabling}
              >
                Disable 2FA
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
               <div className="flex items-center space-x-3">
                <ShieldOff className="h-6 w-6 text-gray-500" />
                <p className="font-medium text-gray-700">2FA is currently disabled.</p>
              </div>
              <Button 
                onClick={handleEnable2FA} 
                disabled={isEnabling}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isEnabling ? "Enabling..." : "Enable 2FA"}
              </Button>
            </div>
          )}
            </CardContent>
          </Card>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              For your security, please enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDisable2FA} disabled={isDisabling}>
              {isDisabling ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Backup Codes!</DialogTitle>
            <DialogDescription>
              Store these codes in a safe place. They can be used to access your account if you lose access to your email.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 p-4 bg-muted rounded-md font-mono text-center space-y-2">
            {backupCodes.map((code, index) => (
              <div key={index}>{code}</div>
            ))}
          </div>
          <DialogFooter className="sm:justify-start gap-2">
            <Button onClick={copyToClipboard} variant="outline" className="flex-1">
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
              <Save className="mr-2 h-4 w-4" /> Download
            </Button>
             <DialogClose asChild>
              <Button className="flex-1">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
